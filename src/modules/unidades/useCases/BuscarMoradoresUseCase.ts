import { AppError } from "@shared/errors/AppError";
import { UnidadeRepository } from "../repositories/UnidadeRepository";
import { BuscarMoradoresDTO } from "../dtos/unidade.dto";

export class BuscarMoradoresUseCase {
  constructor(private repository: UnidadeRepository) {}

  async execute(filters: BuscarMoradoresDTO) {
    const moradores = await this.repository.buscarMoradores(filters);

    if (moradores.length === 0) {
      throw new AppError("Nenhum morador encontrado para esta unidade.", 404);
    }
    return moradores;
  }
}
