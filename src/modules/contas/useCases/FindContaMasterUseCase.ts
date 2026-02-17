import { IContaRepository } from "../repositories/IContaRepository";

export class FindContaMasterUseCase {
  constructor(private contasRepository: IContaRepository) {}

  /**
   * Retorna o ID da conta se o usuário for dono (Master) de uma conta ativa.
   * Retorna null caso contrário.
   */
  async execute(usuarioId: string): Promise<string | null> {
    // Supondo que no seu IContasRepository você criou como 'findContaMaster' ou 'findByDono'
    // O método deve retornar a conta ou null
    const contaId = await this.contasRepository.findContaMaster(usuarioId);

    if (!contaId) {
      return null;
    }

    return contaId;
  }
}
