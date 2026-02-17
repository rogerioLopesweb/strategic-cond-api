import { EntregaRepository } from "../repositories/EntregaRepository";
import { AppError } from "../../../shared/errors/AppError";

export class AtualizarEntregaUseCase {
  constructor(private repository: EntregaRepository) {}

  async execute(id: string, dados: any, operadorId: string) {
    const entrega = await this.repository.buscarPorId(id);
    if (!entrega || entrega.status !== "recebido") {
      throw new AppError(
        "Apenas entregas recebidas e ativas podem ser editadas.",
        400,
      );
    }

    return await this.repository.atualizarStatus(id, {
      marketplace: dados.marketplace,
      observacoes: dados.observacoes,
      codigo_rastreio: dados.codigo_rastreio,
      retirada_urgente: dados.retirada_urgente,
      tipo_embalagem: dados.tipo_embalagem,
      operador_atualizacao_id: operadorId,
      data_atualizacao: new Date(),
    });
  }
}
