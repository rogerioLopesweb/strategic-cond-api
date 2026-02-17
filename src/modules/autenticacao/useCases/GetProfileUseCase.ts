import { IUsuarioRepository } from "@modules/usuarios/repositories/IUsuarioRepository";
import { AppError } from "@shared/errors/AppError";

export class GetProfileUseCase {
  constructor(private usuarioRepository: IUsuarioRepository) {}

  async execute(user_id: string) {
    const user = await this.usuarioRepository.getDetalhado(user_id, "");
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }
}
