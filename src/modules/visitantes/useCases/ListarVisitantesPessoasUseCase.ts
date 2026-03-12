import { IVisitantesRepository } from "../repositories/IVisitantesRepository";

export class ListarVisitantesPessoasUseCase {
  constructor(private repository: IVisitantesRepository) {}

  async execute(filters: { search?: string; page?: number; limit?: number }) {
    // Retorna apenas a lista de cadastros únicos (Pessoas)
    return await this.repository.listarVisitantes(filters);
  }
}