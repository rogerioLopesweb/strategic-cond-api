import { EntregaRepository } from "../repositories/EntregaRepository";
import { ListEntregaFilters } from "../schemas/entregaSchema";

export class ListarEntregasUseCase {
  constructor(private repository: EntregaRepository) {}

  async execute(
    filters: ListEntregaFilters,
    usuarioId?: string,
    perfil?: string,
  ) {
    const result = await this.repository.listar(filters, usuarioId, perfil);
    const totalRegistros = result.pagination.total;
    return {
      success: true,
      pagination: {
        total: totalRegistros,
        page: filters.page,
        limit: filters.limit,
        total_pages: Math.ceil(totalRegistros / filters.limit),
      },
      data: result.data,
    };
  }
}
