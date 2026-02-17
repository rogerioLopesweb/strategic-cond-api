import { ICondominioRepository } from "../repositories/ICondominioRepository";
import { IUpdateCondominioDTO } from "../dtos/condominio.dto";
import { AppError } from "@shared/errors/AppError";

export class AtualizarCondominioUseCase {
  constructor(private repository: ICondominioRepository) {}

  async execute(id: string, dados: IUpdateCondominioDTO, contaId: string) {
    // 1. Garante que o condomínio existe e pertence à conta
    const condominioExistente = await this.repository.findById(id);

    if (
      !condominioExistente ||
      condominioExistente.props.conta_id !== contaId
    ) {
      throw new AppError(
        "Condomínio não encontrado ou você não tem permissão para editá-lo.",
        404,
      );
    }

    // 2. Procede com a atualização
    const condominioAtualizado = await this.repository.update(id, dados);

    if (!condominioAtualizado) {
      // Isso pode ocorrer em uma condição de corrida ou falha no banco.
      throw new AppError("Falha ao atualizar o condomínio.", 500);
    }

    return condominioAtualizado;
  }
}
