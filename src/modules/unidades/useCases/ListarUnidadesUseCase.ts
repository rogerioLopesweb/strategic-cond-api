import { UnidadeRepository } from "../repositories/UnidadeRepository";
import { ListUnidadeFilters } from "../dtos/unidade.dto";

export class ListarUnidadesUseCase {
  constructor(private repository: UnidadeRepository) {}

  async execute(filters: ListUnidadeFilters) {
    const { data, total, page, limit } = await this.repository.listar(filters);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }
}
