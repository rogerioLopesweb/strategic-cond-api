import { ICondominioRepository } from "../repositories/ICondominioRepository";
import { AppError } from "@shared/errors/AppError";
import { IUsuarioAuth } from "@modules/autenticacao/dtos/IAuthDTOs";
import { Condominio } from "../entities/Condominio";

export class BuscarCondominioUseCase {
  constructor(private repository: ICondominioRepository) {}

  async execute(id: string, usuario: IUsuarioAuth): Promise<Condominio> {
    let condominio: Condominio | null = null;

    // Se for um usuário Master/Admin, busca pelo ID e depois valida a conta.
    if (usuario.isMaster) {
      if (!usuario.conta_id) {
        throw new AppError("Conta do administrador não identificada.", 400);
      }
      const condoEncontrado = await this.repository.findById(id);
      if (
        condoEncontrado &&
        condoEncontrado.props.conta_id === usuario.conta_id
      ) {
        condominio = condoEncontrado;
      }
    } else {
      // Se for usuário comum, busca diretamente pelo vínculo, garantindo que ele só veja o que pode.
      condominio = await this.repository.findByIdComVinculo(id, usuario.id);
    }

    if (!condominio) {
      throw new AppError("Condomínio não encontrado ou acesso negado.", 404);
    }

    return condominio;
  }
}
