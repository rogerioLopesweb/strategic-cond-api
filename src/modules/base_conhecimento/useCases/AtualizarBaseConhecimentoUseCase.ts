import { IBaseConhecimentoRepository } from "../repositories/IBaseConhecimentoRepository";
import { IUpdateBaseConhecimentoDTO } from "../dtos/IUpdateBaseConhecimentoDTO";
import { AppError } from "@shared/errors/AppError";

export class AtualizarBaseConhecimentoUseCase {
  constructor(
    private baseConhecimentoRepository: IBaseConhecimentoRepository,
  ) {}

  async execute(
    id: string,
    condominio_id: string,
    data: IUpdateBaseConhecimentoDTO,
  ) {
    const registroAtualizado = await this.baseConhecimentoRepository.update(
      id,
      condominio_id,
      data,
    );

    if (!registroAtualizado) {
      throw new AppError(
        "Registro não encontrado ou você não tem permissão para alterá-lo.",
        404,
      );
    }
    return registroAtualizado;
  }
}
