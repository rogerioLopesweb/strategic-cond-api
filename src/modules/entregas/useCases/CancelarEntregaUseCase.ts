import { EntregaRepository } from "../repositories/EntregaRepository";
import { Entrega } from "../entities/Entrega";
import { AppError } from "../../../shared/errors/AppError";

export class CancelarEntregaUseCase {
  constructor(private repository: EntregaRepository) {}

  async execute(
    id: string,
    motivo: string,
    operadorId: string,
    condominioId: string,
  ) {
    const entregaRow = await this.repository.buscarPorId(id);

    if (!entregaRow || entregaRow.condominio_id !== condominioId) {
      throw new AppError("Entrega não encontrada neste condomínio.", 404);
    }

    const entrega = new Entrega(entregaRow);
    entrega.cancelar(operadorId, motivo);

    return await this.repository.atualizarStatus(id, {
      status: "cancelada",
      data_cancelamento: entrega.props.data_cancelamento,
      operador_cancelamento_id: operadorId,
      motivo_cancelamento: motivo,
    });
  }
}
