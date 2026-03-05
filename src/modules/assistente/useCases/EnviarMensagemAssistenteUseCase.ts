import OpenAI from "openai";
import { IEnviarMensagemDTO } from "../dtos/IAssistenteDTO";
import { AppError } from "@shared/errors/AppError";
import { IAssistenteTool } from "../tools/IAssistenteTool";
import { IAssistenteRepository } from "../repositories/IAssistenteRepository";
import { SessaoChat } from "../entities/SessaoChat";
import { Mensagem } from "../entities/Mensagem";

export class EnviarMensagemAssistenteUseCase {
  private openai: OpenAI;

  // ✅ Injetamos o Repository junto com as Tools
  constructor(
    private tools: IAssistenteTool[],
    private assistenteRepository: IAssistenteRepository,
  ) {
    if (!process.env.OPENAI_API_KEY)
      throw new Error("A chave OPENAI_API_KEY não está configurada.");
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async execute({
    mensagem, // Texto digitado pelo usuário
    condominio_id,
    usuario_id,
    nome_usuario = "Usuário",
    perfil_usuario = "morador",
  }: IEnviarMensagemDTO) {
    try {
      // =========================================================
      // 1. GESTÃO DA SESSÃO (Memória Principal)
      // =========================================================
      let sessao = await this.assistenteRepository.buscarSessaoAtiva(
        usuario_id,
        condominio_id,
      );

      if (!sessao) {
        sessao = new SessaoChat({ condominio_id, usuario_id, status: "ATIVA" });
        await this.assistenteRepository.criarSessao(sessao);
      } else {
        // Atualiza a data de última interação
        sessao.props.updated_at = new Date();
        await this.assistenteRepository.atualizarSessao(sessao);
      }

      // =========================================================
      // 2. SALVAR PERGUNTA DO USUÁRIO
      // =========================================================
      const mensagemUsuario = new Mensagem({
        sessao_id: sessao.id,
        role: "user",
        texto: mensagem,
      });
      await this.assistenteRepository.salvarMensagem(mensagemUsuario);

      // =========================================================
      // 3. BUSCAR HISTÓRICO PARA DAR CONTEXTO À IA
      // =========================================================
      // Pega as últimas 15 mensagens da conversa para economizar tokens, mas manter o contexto
      const historicoDb =
        await this.assistenteRepository.buscarHistoricoPorSessao(sessao.id, 15);

      const primeiroNome = nome_usuario.split(" ")[0];
      const dataAtual = new Date();
      const hora = dataAtual.getHours() - 3; // Ajuste de fuso (cuidado com horário de verão/servidor)

      let saudacaoTempo = "Boa noite";
      if (hora >= 5 && hora < 12) saudacaoTempo = "Bom dia";
      else if (hora >= 12 && hora < 18) saudacaoTempo = "Boa tarde";

      const promptSistema = `
        Você é o Otto, o assistente virtual super amigável do condomínio.
        [CONTEXTO ATUAL] Usuário: ${primeiroNome} | Perfil: ${perfil_usuario} | Data: ${dataAtual.toLocaleDateString("pt-BR")} | Hora local: ${dataAtual.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        [REGRAS]
        1. Responda de forma clara, humanizada e direta (máximo 2 parágrafos).
        2. Chame o usuário pelo nome e use a saudação correta (${saudacaoTempo}).
        3. Você tem acesso a ferramentas (tools) para consultar regras e dados do condomínio. Use-as quando necessário.
      `;

      // Formata o histórico do banco para o padrão da OpenAI
      const historicoFormatado: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
        historicoDb.map((msg) => ({
          role: msg.props.role as "user" | "assistant" | "system",
          content: msg.props.texto,
        }));

      // Monta o Array Final que vai para a API: Sistema + Histórico (O histórico já inclui a última mensagem que acabamos de salvar)
      const historicoMensagens: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
        [{ role: "system", content: promptSistema }, ...historicoFormatado];

      // =========================================================
      // 4. CHAMA A IA (Com suporte a Tools)
      // =========================================================
      const ferramentasOpenAI = this.tools.map((tool) => tool.getDefinition());

      const respostaInicial = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: historicoMensagens,
        tools: ferramentasOpenAI.length > 0 ? ferramentasOpenAI : undefined,
        tool_choice: ferramentasOpenAI.length > 0 ? "auto" : "none",
        temperature: 0.7,
      });

      const mensagemIA = respostaInicial.choices[0].message;
      let textoRespostaIA = mensagemIA.content || "";
      let tokensTotais = respostaInicial.usage?.total_tokens || 0;

      // =========================================================
      // 5. EXECUÇÃO DINÂMICA DAS FERRAMENTAS (Se a IA pedir)
      // =========================================================
      if (mensagemIA.tool_calls && mensagemIA.tool_calls.length > 0) {
        historicoMensagens.push(
          mensagemIA as OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam,
        );

        for (const toolCall of mensagemIA.tool_calls) {
          if (toolCall.type === "function") {
            const ferramentaEncontrada = this.tools.find(
              (t) => t.name === toolCall.function.name,
            );

            if (ferramentaEncontrada) {
              const args = JSON.parse(toolCall.function.arguments);
              const resultadoDaTool = await ferramentaEncontrada.execute(args, {
                condominio_id,
                usuario_id,
                perfil_usuario,
              });

              historicoMensagens.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: resultadoDaTool, // O resultado da sua Base de FAQ ou API de Encomendas
              });
            }
          }
        }

        // Nova chamada para a IA ler o resultado da Tool e formular a resposta em Português
        const respostaFinal = await this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: historicoMensagens,
          temperature: 0.7,
        });

        textoRespostaIA = respostaFinal.choices[0].message.content || "";
        // Soma os tokens da primeira chamada com a segunda
        tokensTotais += respostaFinal.usage?.total_tokens || 0;
      }

      // =========================================================
      // 6. SALVAR A RESPOSTA DO OTTO NO BANCO
      // =========================================================
      const mensagemOtto = new Mensagem({
        sessao_id: sessao.id,
        role: "assistant",
        texto: textoRespostaIA,
        tokens_usados: tokensTotais, // 💰 Auditoria financeira!
      });
      await this.assistenteRepository.salvarMensagem(mensagemOtto);

      // =========================================================
      // 7. DEVOLVE PARA O FRONT-END
      // =========================================================
      return {
        remetente: "otto",
        sessao_id: sessao.id, // ✅ Devolvemos a sessão caso o Front precise
        texto: textoRespostaIA,
        data_hora: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error("Erro na OpenAI/Assistente:", error);
      throw new AppError("O Otto está indisponível no momento.", 500);
    }
  }
}
