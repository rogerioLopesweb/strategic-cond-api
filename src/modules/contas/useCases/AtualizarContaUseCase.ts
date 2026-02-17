import { AppError } from "@shared/errors/AppError";
import { IContaRepository } from "../repositories/IContaRepository";
import { UpdateContaDTO, ContaResponseDTO } from "../dtos/conta.dto";

export class AtualizarContaUseCase {
  constructor(private contaRepository: IContaRepository) {}

  /**
   * Atualiza os dados de uma conta, garantindo a propriedade do registro.
   * @param id ID da conta a ser atualizada.
   * @param dados Objeto contendo os campos a serem alterados.
   * @param donoId ID do usuário logado (para validação de segurança).
   */
  async execute(
    id: string,
    dados: UpdateContaDTO,
    donoId: string,
  ): Promise<ContaResponseDTO> {
    // 1. Tenta realizar a atualização no repositório.
    // O repositório já inclui "WHERE dono_id = $6" para garantir a trava.
    const contaAtualizada = await this.contaRepository.atualizar(
      id,
      dados,
      donoId,
    );

    // 2. Se o banco não retornou nada, significa que o ID não existe
    // ou o usuário tentou editar uma conta que não é dele.
    if (!contaAtualizada) {
      throw new AppError(
        "Conta não encontrada ou você não tem permissão para editá-la.",
        403,
      );
    }

    // 3. Retorna a conta com os dados novos.
    return contaAtualizada;
  }
}
