import { IVisitantesRepository } from "../repositories/IVisitantesRepository";

interface IRequest {
  visitante_id: string;
  condominio_id: string;
  acao: "registrar" | "remover";
  dados?: {
    tipo_restricao: string;
    descricao: string;
    instrucao_portaria: string;
  };
}

export class GerenciarRestricaoUseCase {
  constructor(private repository: IVisitantesRepository) {}

  async execute({ visitante_id, condominio_id, acao, dados }: IRequest) {
    if (acao === "registrar" && dados) {
      await this.repository.registrarRestricao({
        visitante_id,
        condominio_id,
        ...dados
      });
    } else {
      await this.repository.removerRestricao(visitante_id, condominio_id);
    }
  }
}