import { AppError } from "@shared/errors/AppError";
import { UnidadeRepository } from "../repositories/UnidadeRepository";
import { AtualizarStatusVinculoDTO } from "../schemas/unidadeSchema"; // 🎯 Ajustado para o seu schema central

export class AtualizarStatusVinculoUseCase {
  constructor(private repository: UnidadeRepository) {}

  async execute(dados: AtualizarStatusVinculoDTO) {
    // 🚀 Chamamos o método do repositório. O Use Case não sabe COMO o SQL é feito.
    const vinculoAtualizado = await this.repository.atualizarStatusVinculo(
      dados.usuario_id,
      dados.unidade_id,
      dados.status,
    );

    // 🛡️ Se o repositório retornou 'false', significa que não achou o registro
    if (!vinculoAtualizado) {
      throw new AppError(
        "Vínculo não encontrado ou não pertence a este condomínio.",
        404,
      );
    }

    // 🎯 Lógica de resposta (Isso sim pertence ao Use Case)
    return {
      success: true,
      message: dados.status
        ? "Morador reativado com sucesso."
        : "Saída registrada! O morador agora consta no histórico de ex-moradores.",
    };
  }
}
