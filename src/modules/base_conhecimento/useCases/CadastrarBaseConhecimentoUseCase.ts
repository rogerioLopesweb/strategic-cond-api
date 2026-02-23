import { IBaseConhecimentoRepository } from "../repositories/IBaseConhecimentoRepository";
import { ICreateBaseConhecimentoDTO } from "../dtos/ICreateBaseConhecimentoDTO";
import { AppError } from "@shared/errors/AppError";

export class CadastrarBaseConhecimentoUseCase {
  constructor(
    private baseConhecimentoRepository: IBaseConhecimentoRepository,
  ) {}

  async execute(data: ICreateBaseConhecimentoDTO) {
    if (!data.titulo || !data.categoria || !data.descricao) {
      throw new AppError("Título, categoria e descrição são obrigatórios.");
    }

    if (!data.condominio_id) {
      throw new AppError("O ID do condomínio é obrigatório.");
    }

    const novaInformacao = await this.baseConhecimentoRepository.create({
      condominio_id: data.condominio_id,
      titulo: data.titulo,
      categoria: data.categoria,
      descricao: data.descricao,
      id_user_cadastrou: data.id_user_cadastrou,
    });

    return novaInformacao;
  }
}
