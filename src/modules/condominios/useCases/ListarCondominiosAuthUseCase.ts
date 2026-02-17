import {
  ICondominioRepository,
  ICondominioAuthDTO,
} from "../repositories/ICondominioRepository";

export class ListarCondominiosAuthUseCase {
  constructor(private condominiosRepository: ICondominioRepository) {}

  /**
   * Busca os condomínios vinculados ao usuário de forma otimizada para o Auth.
   * Retorna apenas: id, nome_fantasia e perfil.
   */
  async execute(usuarioId: string): Promise<ICondominioAuthDTO[]> {
    const condominios =
      await this.condominiosRepository.listarParaAuth(usuarioId);

    return condominios;
  }
}
