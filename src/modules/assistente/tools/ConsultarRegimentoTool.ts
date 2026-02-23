import OpenAI from "openai";
import { IAssistenteTool, IToolContext } from "./IAssistenteTool";
import { IBaseConhecimentoRepository } from "@modules/base_conhecimento/repositories/IBaseConhecimentoRepository";

export class ConsultarRegimentoTool implements IAssistenteTool {
  public name = "consultar_informacoes_condominio";

  // 👇 Recebemos o repositório real aqui!
  constructor(
    private baseConhecimentoRepository: IBaseConhecimentoRepository,
  ) {}

  getDefinition(): OpenAI.Chat.Completions.ChatCompletionTool {
    return {
      type: "function",
      function: {
        name: this.name,
        description:
          "Busca informações de apoio, regras dinâmicas, regimento e contatos úteis do condomínio.",
        parameters: {
          type: "object",
          properties: {
            assunto: {
              type: "string",
              description:
                "O tema principal da dúvida. Ex: piscina, lixo, barulho, contato.",
            },
          },
          required: ["assunto"],
        },
      },
    };
  }

  async execute(args: any, context: IToolContext): Promise<string> {
    const { assunto } = args;
    console.log(`[Tool] Otto buscando no banco real sobre: ${assunto}...`);

    // =========================================================
    // 🚀 BUSCA REAL NO BANCO DE DADOS
    // =========================================================
    // O método buscarParaIA já traz filtrado apenas pelo condomínio do usuário
    // e retorna apenas Titulo, Categoria e Descrição (poupando tokens!)
    const informacoesDeApoio =
      await this.baseConhecimentoRepository.buscarParaIA(context.condominio_id);

    // Se o síndico não cadastrou nada ainda para este condomínio
    if (!informacoesDeApoio || informacoesDeApoio.length === 0) {
      return JSON.stringify({
        mensagem:
          "Ainda não há regras ou informações de apoio cadastradas no sistema para este condomínio.",
      });
    }

    // Devolve o JSON limpo para a Inteligência Artificial ler e processar
    return JSON.stringify(informacoesDeApoio);
  }
}
