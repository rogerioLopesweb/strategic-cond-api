import { IVisitantesRepository } from "../repositories/IVisitantesRepository";
import { AppError } from "@shared/errors/AppError";

interface IRequest {
  id: string;
  condominio_id: string;
  operador_id: string;
  dados: {
    tipo_restricao: string;
    descricao: string;
    instrucao_portaria: string;
  };
}

export class UpdateRestricaoUseCase {
  constructor(private visitantesRepository: IVisitantesRepository) {}

  async execute({ id, condominio_id, operador_id, dados }: IRequest) {
    if (!id || !condominio_id) {
      throw new AppError("ID da restrição e do condomínio são obrigatórios.");
    }

    // 🛡️ O Repository já faz o WHERE id AND condominio_id para segurança
    await this.visitantesRepository.updateRestricao(id, condominio_id, {
      ...dados,
      operador_id,
    });

    return { success: true, message: "Restrição atualizada com sucesso." };
  }
}