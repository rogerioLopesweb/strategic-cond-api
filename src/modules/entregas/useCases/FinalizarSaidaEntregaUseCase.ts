import { EntregaRepository } from "../repositories/EntregaRepository";
import { RegistrarRetiradaDTO } from "../schemas/entregaSchema";
import { Entrega } from "../entities/Entrega";
import { AppError } from "../../../shared/errors/AppError";
import { IStorageProvider } from "../../../shared/providers/StorageProvider/models/IStorageProvider";

export class FinalizarSaidaEntregaUseCase {
  constructor(
    private repository: EntregaRepository,
    private storageProvider: IStorageProvider, // 🎯 Injetando o motor de storage
  ) {}

  async execute(
    dados: RegistrarRetiradaDTO,
    operadorId: string,
    isQRCode = false,
  ) {
    // 1. Busca os dados brutos no banco
    const entregaRow = await this.repository.buscarPorId(dados.entrega_id);
    if (!entregaRow) throw new AppError("Entrega não encontrada.", 404);

    // 2. Transforma em Entidade para validar regras de negócio
    const entrega = new Entrega(entregaRow);

    // 3. Gerencia o upload da foto da assinatura/recebedor se existir
    let urlFotoRetirada = null;
    if (dados.foto_retirada_base64) {
      const path = await this.storageProvider.uploadFoto(
        dados.foto_retirada_base64,
        `retirada-${dados.entrega_id}-${Date.now()}`,
      );

      if (path) {
        urlFotoRetirada =
          await this.storageProvider.gerarLinkVisualizacao(path);
      }
    }

    // 4. Define quem está retirando com base na origem (QR ou Manual)
    const quemRetirou = isQRCode ? "Portador do QR Code" : dados.retirado_por;
    const documento = isQRCode
      ? "Validado via App"
      : dados.documento_retirada || "Não informado";

    // 5. Executa a lógica de mudança de estado na Entidade (valida se pode sair)
    entrega.finalizarSaida(operadorId, quemRetirou, documento);

    // 6. Persiste a atualização no banco de dados via Repositório
    return await this.repository.atualizarStatus(dados.entrega_id, {
      status: "entregue",
      data_entrega: entrega.props.data_entrega,
      operador_saida_id: operadorId,
      quem_retirou: quemRetirou,
      documento_retirou: documento,
    });
  }
}
