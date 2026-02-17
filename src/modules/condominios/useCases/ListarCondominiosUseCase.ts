import { ICondominioRepository } from "../repositories/ICondominioRepository";
import { IListCondominioFilters } from "../dtos/condominio.dto";
import { AppError } from "@shared/errors/AppError";
import { UsuarioAuth } from "@modules/autenticacao/schemas/authSchema";

export class ListarCondominiosUseCase {
  constructor(private repository: ICondominioRepository) {}

  async execute(usuario: UsuarioAuth, filters: IListCondominioFilters) {
    if (!usuario || !usuario.id) {
      throw new AppError("Usuário não autenticado.", 401);
    }

    // Se o usuário for Master/Admin, lista todos os condomínios da conta.
    if (usuario.isMaster) {
      if (!usuario.conta_id) {
        throw new AppError(
          "Conta não identificada para o usuário administrador.",
          400,
        );
      }
      return this.repository.findAll(usuario.conta_id, filters);
    }

    // Caso contrário, lista apenas os condomínios aos quais o usuário está vinculado.
    // O método `listarMeus` foi mantido no repositório para essa lógica específica.
    // @ts-ignore
    return this.repository.listarMeus(usuario.id, filters);
  }
}
