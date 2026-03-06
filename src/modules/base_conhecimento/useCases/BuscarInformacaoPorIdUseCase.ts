import { AppError } from "@shared/errors/AppError";
import { IBaseConhecimentoRepository } from "../repositories/IBaseConhecimentoRepository";

export class BuscarInformacaoPorIdUseCase {
  constructor(private baseConhecimentoRepository: IBaseConhecimentoRepository) {}

  async execute(id: string, condominio_id: string) {
    const item = await this.baseConhecimentoRepository.findById(id, condominio_id);

    if (!item) {
      throw new AppError("Informação não encontrada na base de conhecimento.", 404);
    }

    return item;
  }
}