import { IVisitantesRepository } from "../repositories/IVisitantesRepository";
import { AppError } from "@shared/errors/AppError";

interface IRequest {
  id: string;
  dataSaida: Date;
  operador_id: string; // ✅ Adicionado para rastrear quem deu a baixa
}

export class RegistrarSaidaUseCase {
  constructor(private visitantesRepository: IVisitantesRepository) {}

  async execute({ id, dataSaida, operador_id }: IRequest) {
    if (!id) {
      throw new AppError("ID da visita é obrigatório.");
    }

    if (!operador_id) {
      throw new AppError(
        "ID do operador é obrigatório para registrar a saída.",
      );
    }

    // ✅ Passando o operador_id para carimbar a auditoria no banco de dados
    await this.visitantesRepository.registrarSaida(id, dataSaida, operador_id);

    return { message: "Saída registrada com sucesso." };
  }
}
