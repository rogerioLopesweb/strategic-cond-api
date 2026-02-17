import { AppError } from "@shared/errors/AppError";
import { UnidadeRepository } from "../repositories/UnidadeRepository";
import { VincularMoradorDTO } from "../schemas/unidadeSchema";

export class VincularMoradorUseCase {
  constructor(private repository: UnidadeRepository) {}

  async execute(dados: VincularMoradorDTO): Promise<void> {
    // 🛡️ Regra 1: A unidade precisa existir
    const unidade = await this.repository.buscarPorId(dados.unidade_id);
    if (!unidade) {
      throw new AppError("A unidade informada não foi encontrada.", 404);
    }

    // 🛡️ Regra 2: Segurança Multi-tenant (Unidade deve pertencer ao condomínio)
    if (unidade.condominio_id !== dados.condominio_id) {
      throw new AppError(
        "Esta unidade não pertence ao condomínio informado.",
        403,
      );
    }

    // 🚀 Executa a persistência através do repositório
    await this.repository.vincularMorador(dados);
  }
}
