import { IBaseConhecimentoRepository } from "../repositories/IBaseConhecimentoRepository";
import { AppError } from "@shared/errors/AppError";

export class DeletarBaseConhecimentoUseCase {
  constructor(
    private baseConhecimentoRepository: IBaseConhecimentoRepository,
  ) {}

  async execute(id: string, condominio_id: string, id_user_alterou: string) {
    const deletado = await this.baseConhecimentoRepository.delete(
      id,
      condominio_id,
      id_user_alterou,
    );

    if (!deletado) {
      throw new AppError("Registro não encontrado ou já deletado.", 404);
    }
    return true;
  }
}
