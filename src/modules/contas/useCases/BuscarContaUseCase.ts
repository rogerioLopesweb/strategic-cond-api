import { AppError } from "@shared/errors/AppError";
import { IContaRepository } from "../repositories/IContaRepository";
import { ContaResponseDTO } from "../dtos/conta.dto";

export class BuscarContaUseCase {
  constructor(private contaRepository: IContaRepository) {}

  /**
   * Busca os detalhes de uma conta específica garantindo que pertença ao usuário.
   * @param id ID da conta (UUID).
   * @param donoId ID do usuário autenticado.
   */
  async execute(id: string, donoId: string): Promise<ContaResponseDTO> {
    const conta = await this.contaRepository.buscarPorId(id, donoId);

    // Se não encontrar, lançamos 404.
    // Como a query já filtra pelo dono_id, um 404 aqui também protege contra
    // tentativas de "bisbilhotar" IDs de outros usuários.
    if (!conta) {
      throw new AppError("Conta não encontrada.", 404);
    }

    return conta;
  }
}
