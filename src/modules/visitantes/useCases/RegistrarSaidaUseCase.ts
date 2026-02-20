import { IVisitantesRepository } from "../repositories/IVisitantesRepository";
import { AppError } from "@shared/errors/AppError";

interface IRequest {
  id: string;
  dataSaida: Date;
}

export class RegistrarSaidaUseCase {
  constructor(private visitantesRepository: IVisitantesRepository) {}

  async execute({ id, dataSaida }: IRequest) {
    if (!id) {
      throw new AppError("ID da visita é obrigatório.");
    }

    await this.visitantesRepository.registrarSaida(id, dataSaida);

    return { message: "Saída registrada com sucesso." };
  }
}
