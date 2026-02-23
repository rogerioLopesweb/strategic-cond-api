import { ICondominioRepository } from "../repositories/ICondominioRepository";
import { ICreateCondominioDTO } from "../dtos/condominio.dto";
import { AppError } from "@shared/errors/AppError";
import { Condominio } from "../entities/Condominio";
import { IUsuarioAuth } from "@modules/autenticacao/dtos/IAuthDTOs";

export class CadastrarCondominioUseCase {
  constructor(private repository: ICondominioRepository) {}

  async execute(
    dados: ICreateCondominioDTO,
    usuario: IUsuarioAuth,
  ): Promise<Condominio> {
    // Regra: Apenas usuários Master podem cadastrar novos condomínios
    if (!usuario.isMaster) {
      throw new AppError(
        "Acesso negado: Apenas usuários Master podem cadastrar condomínios.",
        403,
      );
    }

    const contaAlvo = dados.conta_id || usuario.conta_id;

    if (!contaAlvo) {
      throw new AppError("Conta alvo não identificada.", 400);
    }

    // Regra de negócio: Verificar se já existe um condomínio com o mesmo CNPJ na conta
    if (dados.cnpj) {
      const condominioExistente = await this.repository.findByCnpj(
        dados.cnpj,
        contaAlvo,
      );
      if (condominioExistente) {
        throw new AppError(
          "Já existe um condomínio com este CNPJ nesta conta.",
          409, // Conflict
        );
      }
    }

    // 1. Cria o condomínio
    const novoCondominio = await this.repository.create(dados, contaAlvo);
    if (!novoCondominio.id) {
      // Garantia de tipo, embora o create deva sempre retornar um id.
      throw new AppError("Falha ao criar o condomínio.", 500);
    }

    // 2. Vincula o usuário que o cadastrou como administrador/responsável
    await this.repository.vincularUsuario(
      novoCondominio.id,
      usuario.id,
      "administrador", // O criador (Master) entra sempre com perfil de administrador no novo condomínio
    );

    return novoCondominio;
  }
}
