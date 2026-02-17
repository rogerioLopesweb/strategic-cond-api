// src_solid/modules/usuarios/use-cases/SalvarPushTokenUseCase.ts
import { IUsuarioRepository } from "../repositories/IUsuarioRepository";

export class SalvarPushTokenUseCase {
  constructor(private usuarioRepository: IUsuarioRepository) {}

  async execute(usuarioId: string, token: string) {
    if (!token) throw new Error("Token inválido.");

    await this.usuarioRepository.updatePushToken(usuarioId, token);
  }
}
