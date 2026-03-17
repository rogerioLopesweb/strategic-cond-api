import { IVisitantesRepository } from "../repositories/IVisitantesRepository";
import { AppError } from "@shared/errors/AppError";

interface IRequest {
  id: string;
  operador_id: string; 
  condominio_id: string;
}

/**
 * RegistrarSaidaUseCase: Finaliza um ciclo de visita.
 * Garante que a baixa seja auditada e restrita ao condomínio correto.
 */
export class RegistrarSaidaUseCase {
  constructor(private visitantesRepository: IVisitantesRepository) {}

  async execute({ id, operador_id, condominio_id }: IRequest) {
    // 🛡️ 1. Validações de Segurança de Contexto
    if (!id) {
      throw new AppError("O ID da visita é obrigatório para registrar a saída.", 400);
    }

    if (!operador_id || !condominio_id) {
      throw new AppError("Contexto de operador ou condomínio inválido.", 401);
    }

    // 🚀 2. Execução no Repositório
    // O Repository usa 'WHERE id = $1 AND condominio_id = $2' para blindagem total.
    await this.visitantesRepository.registrarSaida(id, operador_id, condominio_id);

    return { 
      success: true,
      status: "finalizada",
      message: "Saída registrada com sucesso no sistema." 
    };
  }
}