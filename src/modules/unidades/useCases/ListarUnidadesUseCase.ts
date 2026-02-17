import { UnidadeRepository } from "../repositories/UnidadeRepository";
import { ListUnidadeFilters } from "../dtos/unidade.dto";

export class ListarUnidadesUseCase {
  constructor(private repository: UnidadeRepository) {}

  async execute(filters: ListUnidadeFilters) {
    const result = await this.repository.listar(filters);

    return {
      data: result.data,
      pagination: {
        total: result.total,
        page: filters.page,
        limit: filters.limit,
        total_pages: Math.ceil(result.total / filters.limit),
      },
    };
  }
}
