import { IVisitantesRepository } from "../repositories/IVisitantesRepository";
import { ListVisitasFiltersDTO } from "../dtos/ListVisitasFiltersDTO";

export class ListarVisitasUseCase {
  constructor(private visitantesRepository: IVisitantesRepository) {}

  async execute(
    filters: ListVisitasFiltersDTO,
    usuarioId?: string,
    perfil?: string,
  ) {
    // A inteligência dos filtros (status, bloco, etc) já está toda no Repository.
    // O UseCase apenas repassa os dados do Controller para o Repo.
    const resultado = await this.visitantesRepository.listar(
      filters,
      usuarioId,
      perfil,
    );

    return resultado;
  }
}
