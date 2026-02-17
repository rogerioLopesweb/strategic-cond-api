// src_solid/modules/usuarios/use-cases/AlterarStatusUsuarioUseCase.ts
import { IUsuarioRepository } from "../repositories/IUsuarioRepository";

export class AlterarStatusUsuarioUseCase {
  constructor(private usuarioRepository: IUsuarioRepository) {}

  async execute(id: string, condominioId: string, ativo: boolean) {
    const resultado = await this.usuarioRepository.updateStatus(
      id,
      condominioId,
      ativo,
    );

    if (!resultado) {
      throw new Error("Não foi possível alterar o status do usuário.");
    }

    return resultado;
  }
}
