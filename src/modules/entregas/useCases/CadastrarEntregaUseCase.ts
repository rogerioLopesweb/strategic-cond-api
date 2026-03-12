import { EntregaRepository } from "../repositories/EntregaRepository";
import { Entrega } from "../entities/Entrega";
import { CreateEntregaDTO } from "../schemas/entregaSchema";
import { IStorageProvider } from "../../../shared/providers/StorageProvider/models/IStorageProvider";
import { db } from "../../../shared/infra/database/connection";

export class CadastrarEntregaUseCase {
  constructor(
    private repository: EntregaRepository,
    private storageProvider: IStorageProvider,
  ) {}

  async execute(dados: CreateEntregaDTO, operadorId: string) {
    // 🎯 Garantindo conexão única para a transação
    const client = await db.connect();

    try {
      await client.query("BEGIN");

      // 1. Tratamento da Imagem
      let urlFoto = dados.urlFoto || null;

      if (dados.foto_base64) {
        const path = await this.storageProvider.uploadFoto(
          dados.foto_base64,
          `entrega-${Date.now()}`,
        );

        if (path) {
          urlFoto = await this.storageProvider.gerarLinkVisualizacao(path);
        }
      }

      // 2. Criação da Entidade
      const entrega = new Entrega({
        condominio_id: dados.condominio_id,
        operador_entrada_id: operadorId,
        unidade: dados.unidade,
        bloco: dados.bloco,
        marketplace: dados.marketplace || "Não informado",
        codigo_rastreio: dados.codigo_rastreio,
        morador_id: dados.morador_id,
        observacoes: dados.observacoes || undefined,
        status: "recebido",
        data_recebimento: new Date(),
        url_foto_etiqueta: urlFoto || undefined,
        retirada_urgente: dados.retirada_urgente || false,
        tipo_embalagem: dados.tipo_embalagem || "Pacote",
      });

      // 3. Persistência
      const novaEntrega = await this.repository.salvar(entrega);

      // 4. Lógica de Notificação
      if (dados.morador_id) {
        const resMorador = await client.query(
          "SELECT nome_completo, expo_push_token, email FROM usuarios WHERE id = $1",
          [dados.morador_id],
        );

        const morador = resMorador.rows[0];
        
        if (morador) {
          const primeiroNome = morador.nome_completo.split(" ")[0] || "Morador(a)";
          const origemRaw = dados.marketplace?.trim() || "Correios";
          const origem = origemRaw.toLowerCase() === "correios" ? "dos Correios" : `da ${origemRaw}`;

          // --- 📱 NOTIFICAÇÃO PUSH ---
          if (morador.expo_push_token) {
            await client.query(
              `INSERT INTO notificacoes (
                condominio_id, usuario_id, entrega_id, canal, titulo, mensagem, destino
              ) VALUES ($1, $2, $3, 'push', $4, $5, $6)`,
              [
                dados.condominio_id,
                dados.morador_id,
                novaEntrega.id,
                "📦 Encomenda na Portaria!",
                `Olá ${primeiroNome}, sua encomenda ${origem} já está disponível para retirada. 🏡`,
                morador.expo_push_token,
              ],
            );
          }

          // --- ✉️ NOTIFICAÇÃO EMAIL ---
          if (morador.email) {
            await client.query(
              `INSERT INTO notificacoes (
                condominio_id, usuario_id, entrega_id, canal, titulo, mensagem, destino
              ) VALUES ($1, $2, $3, 'email', $4, $5, $6)`,
              [
                dados.condominio_id,
                dados.morador_id,
                novaEntrega.id,
                "Otto - 📦 Nova Encomenda Recebida",
                `Olá ${primeiroNome}, informamos que uma encomenda vinda ${origem} foi entregue na portaria e aguarda sua retirada.`,
                morador.email,
              ],
            );
          }
        } // Fechamento do if (morador)
      } // Fechamento do if (dados.morador_id)

      await client.query("COMMIT");
      return novaEntrega;

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      // Libera o cliente de volta para o pool
      client.release();
    }
  }
}