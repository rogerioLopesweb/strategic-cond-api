import OpenAI from "openai";
import { IEnviarMensagemDTO } from "../dtos/IAssistenteDTO";
import { AppError } from "@shared/errors/AppError";
import { IAssistenteTool } from "../tools/IAssistenteTool";

export class EnviarMensagemAssistenteUseCase {
  private openai: OpenAI;

  // Recebe uma lista de ferramentas na injeção de dependência!
  constructor(private tools: IAssistenteTool[]) {
    if (!process.env.OPENAI_API_KEY)
      throw new Error("A chave OPENAI_API_KEY não está configurada.");
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async execute({
    mensagem,
    condominio_id,
    usuario_id,
    nome_usuario = "Usuário",
    perfil_usuario = "morador",
  }: IEnviarMensagemDTO) {
    try {
      const primeiroNome = nome_usuario.split(" ")[0];
      const dataAtual = new Date();
      const hora = dataAtual.getHours() - 3;

      let saudacaoTempo = "Boa noite";
      if (hora >= 5 && hora < 12) saudacaoTempo = "Bom dia";
      else if (hora >= 12 && hora < 18) saudacaoTempo = "Boa tarde";

      const promptSistema = `
        Você é o Otto, o assistente virtual super amigável do condomínio.
        [CONTEXTO ATUAL] Usuário: ${primeiroNome} | Perfil: ${perfil_usuario} | Data: ${dataAtual.toLocaleDateString("pt-BR")} | Hora local: ${dataAtual.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        [REGRAS]
        1. Responda de forma clara, humanizada e direta (máximo 2 parágrafos).
        2. Chame o usuário pelo nome e use a saudação correta (${saudacaoTempo}).
      `;

      // 1. Extrai as definições de todas as ferramentas injetadas
      const ferramentasOpenAI = this.tools.map((tool) => tool.getDefinition());

      const historicoMensagens: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
        [
          { role: "system", content: promptSistema },
          { role: "user", content: mensagem },
        ];

      // 2. Chama a IA
      const respostaInicial = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: historicoMensagens,
        tools: ferramentasOpenAI.length > 0 ? ferramentasOpenAI : undefined,
        tool_choice: ferramentasOpenAI.length > 0 ? "auto" : "none",
        temperature: 0.7,
      });

      const mensagemIA = respostaInicial.choices[0].message;

      // 3. Execução DINÂMICA das ferramentas
      if (mensagemIA.tool_calls && mensagemIA.tool_calls.length > 0) {
        historicoMensagens.push(
          mensagemIA as OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam,
        );

        for (const toolCall of mensagemIA.tool_calls) {
          if (toolCall.type === "function") {
            // Busca na nossa lista a ferramenta que a IA quer usar
            const ferramentaEncontrada = this.tools.find(
              (t) => t.name === toolCall.function.name,
            );

            if (ferramentaEncontrada) {
              const args = JSON.parse(toolCall.function.arguments);

              // Executa a ferramenta de forma agnóstica (não importa se é encomenda, visitante, etc)
              const resultadoDaTool = await ferramentaEncontrada.execute(args, {
                condominio_id,
                usuario_id,
                perfil_usuario,
              });

              historicoMensagens.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: resultadoDaTool,
              });
            }
          }
        }

        const respostaFinal = await this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: historicoMensagens,
          temperature: 0.7,
        });

        return {
          remetente: "otto",
          texto: respostaFinal.choices[0].message.content,
          data_hora: new Date().toISOString(),
        };
      }

      return {
        remetente: "otto",
        texto: mensagemIA.content,
        data_hora: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error("Erro na OpenAI:", error);
      throw new AppError("O Otto está indisponível no momento.", 500);
    }
  }
}
