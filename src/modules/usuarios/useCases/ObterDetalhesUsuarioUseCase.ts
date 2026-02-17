// src_solid/modules/usuarios/use-cases/ObterDetalhesUsuarioUseCase.ts
import { IUsuarioRepository } from "../repositories/IUsuarioRepository";

export class ObterDetalhesUsuarioUseCase {
  constructor(private usuarioRepository: IUsuarioRepository) {}

  async execute(id: string, condominioId: string) {
    const usuario = await this.usuarioRepository.getDetalhado(id, condominioId);

    if (!usuario) {
      throw new Error("Usuário não encontrado neste condomínio.");
    }

    return usuario;
  }
}
