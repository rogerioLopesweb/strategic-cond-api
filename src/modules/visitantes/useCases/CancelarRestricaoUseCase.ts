import { IVisitantesRepository } from "../repositories/IVisitantesRepository";
import { AppError } from "@shared/errors/AppError";

interface IRequest {
  id: string;
  condominio_id: string;
  operador_id: string;
}

export class CancelarRestricaoUseCase {
  constructor(private visitantesRepository: IVisitantesRepository) {}

  async execute({ id, condominio_id, operador_id }: IRequest) {
    if (!id) throw new AppError("ID da restrição é obrigatório.");

    // Muda o status para inativo (Resolvido)
    await this.visitantesRepository.cancelarRestricao(id, operador_id, condominio_id);

    return { success: true, message: "Bloqueio desativado no sistema." };
  }
}