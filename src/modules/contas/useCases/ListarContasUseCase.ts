import { IContaRepository } from "../repositories/IContaRepository";
import { ContaResponseDTO } from "../dtos/conta.dto";

export class ListarContasUseCase {
  constructor(private contaRepository: IContaRepository) {}

  /**
   * Executa a listagem de contas filtrando pelo dono (usuário logado).
   * @param donoId ID do usuário extraído do token JWT.
   */
  async execute(donoId: string): Promise<ContaResponseDTO[]> {
    // Busca no repositório
    const contas = await this.contaRepository.listarPorDono(donoId);

    // Aqui você poderia realizar formatações adicionais se necessário,
    // como mascarar o CNPJ ou formatar datas para o frontend.

    return contas;
  }
}
