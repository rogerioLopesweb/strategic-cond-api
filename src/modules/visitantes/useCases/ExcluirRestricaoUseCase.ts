import { IVisitantesRepository } from "../repositories/IVisitantesRepository";
import { AppError } from "@shared/errors/AppError";

interface IRequest {
  id: string;
  condominio_id: string;
  operador_id: string;
}

export class ExcluirRestricaoUseCase {
  constructor(private visitantesRepository: IVisitantesRepository) {}

  async execute({ id, condominio_id, operador_id }: IRequest) {
    if (!id) throw new AppError("ID da restrição é obrigatório.");

    // Executa o soft delete auditado
    await this.visitantesRepository.excluirRestricao(id, operador_id, condominio_id);

    return { success: true, message: "Registro de restrição removido." };
  }
}