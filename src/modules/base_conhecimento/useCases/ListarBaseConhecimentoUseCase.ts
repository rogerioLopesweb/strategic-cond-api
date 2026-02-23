import { IBaseConhecimentoRepository } from "../repositories/IBaseConhecimentoRepository";
import { IListBaseConhecimentoFilters } from "../dtos/IListBaseConhecimentoFilters";

export class ListarBaseConhecimentoUseCase {
  constructor(
    private baseConhecimentoRepository: IBaseConhecimentoRepository,
  ) {}

  async execute(condominio_id: string, filters: IListBaseConhecimentoFilters) {
    return await this.baseConhecimentoRepository.findAll(
      condominio_id,
      filters,
    );
  }
}
