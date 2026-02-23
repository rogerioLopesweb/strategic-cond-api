import OpenAI from "openai";
import { IAssistenteTool, IToolContext } from "./IAssistenteTool";
import { ListarEntregasUseCase } from "@modules/entregas/useCases/ListarEntregasUseCase";

export class VerificarEncomendasTool implements IAssistenteTool {
  public name = "verificar_encomendas";

  constructor(private listarEntregasUseCase: ListarEntregasUseCase) {}

  // 1. Ensina para a IA o que essa ferramenta faz e quais filtros ela aceita
  getDefinition(): OpenAI.Chat.Completions.ChatCompletionTool {
    return {
      type: "function",
      function: {
        name: this.name,
        description:
          "Busca entregas no sistema. Pode filtrar por bloco, unidade, status, urgência e dias parados.",
        parameters: {
          type: "object",
          properties: {
            bloco: { type: "string", description: "O bloco. Ex: A, B, 1" },
            unidade: {
              type: "string",
              description: "O número do apto. Ex: 101",
            },
            status_entrega: {
              type: "string",
              enum: ["recebido", "entregue", "cancelada"],
              description:
                "Status da encomenda. Se não especificado, use 'recebido'.",
            },
            apenas_urgentes: {
              type: "boolean",
              description:
                "Verdadeiro se perguntar por entregas urgentes, perecíveis ou geladeira.",
            },
            dias_parado: {
              type: "number",
              description:
                "Se perguntar por encomendas paradas há mais de X dias, envie o número de dias aqui.",
            },
          },
        },
      },
    };
  }

  // 2. Executa a busca real no banco de dados
  async execute(args: any, context: IToolContext): Promise<string> {
    const {
      bloco,
      unidade,
      status_entrega = "recebido",
      apenas_urgentes,
      dias_parado,
    } = args;

    console.log(
      `[Tool] Executando ${this.name}: Bloco ${bloco}, Apto ${unidade}, Status: ${status_entrega}...`,
    );

    // Lógica para calcular a data de filtro caso o morador pergunte de encomendas velhas
    let dataFim;
    if (dias_parado) {
      const data = new Date();
      data.setDate(data.getDate() - dias_parado);
      dataFim = data.toISOString(); // Vai buscar entregas que chegaram ANTES dessa data
    }

    // 🛡️ REGRA DE NEGÓCIO: Morador só vê o dele, Portaria vê de todos
    const idParaFiltro =
      context.perfil_usuario === "morador" ? context.usuario_id : undefined;

    // Chamada real ao banco de dados
    const resultadoEntregas = await this.listarEntregasUseCase.execute(
      {
        condominio_id: context.condominio_id,
        page: 1,
        limit: 10,
        bloco,
        unidade,
        status: status_entrega as any,
        retirada_urgente: apenas_urgentes ? "sim" : undefined,
        data_fim: dataFim,
      },
      idParaFiltro,
      context.perfil_usuario,
    );

    const entregasReais = resultadoEntregas.data;

    // Retorna o JSON como string para o Otto ler
    if (entregasReais && entregasReais.length > 0) {
      return JSON.stringify(entregasReais);
    }

    return JSON.stringify({
      mensagem: `Nenhuma encomenda encontrada com o status '${status_entrega}' para este filtro no momento.`,
    });
  }
}
