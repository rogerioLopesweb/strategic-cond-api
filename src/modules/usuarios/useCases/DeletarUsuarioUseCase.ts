// src_solid/modules/usuarios/use-cases/DeletarUsuarioUseCase.ts
import { IUsuarioRepository } from "../repositories/IUsuarioRepository";

export class DeletarUsuarioUseCase {
  constructor(private usuarioRepository: IUsuarioRepository) {}

  async execute(id: string) {
    // Regra de segurança: verificar se o usuário existe antes de tentar deletar
    const usuario = await this.usuarioRepository.getDetalhado(id, ""); // Pode ajustar o repo para findById simples

    if (!usuario) throw new Error("Usuário não encontrado.");

    await this.usuarioRepository.delete(id);
  }
}
