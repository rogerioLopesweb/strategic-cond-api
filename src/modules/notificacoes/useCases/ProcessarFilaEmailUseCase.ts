import { NotificacaoRepository } from "../repositories/NotificacaoRepository";
import { IMailProvider } from "@shared/providers/notificacoes/email/IMailProvider";

export class ProcessarFilaEmailUseCase {
  constructor(
    private repository: NotificacaoRepository,
    private mailProvider: IMailProvider,
  ) {}

  async execute(limit: number): Promise<number> {
    // 1. Procura notificações de e-mail pendentes no banco de dados
    const pendentes = await this.repository.buscarPendentes("email", limit);

    if (pendentes.length === 0) {
      return 0;
    }

    const idsSucesso: string[] = [];
    const idsErro: string[] = [];

    // 2. Processa cada e-mail da fila
    for (const notificacao of pendentes) {
      try {
        await this.mailProvider.sendMail({
          to: notificacao.destino || notificacao.email_usuario,
          subject: notificacao.titulo,
          body: notificacao.mensagem,
        });

        idsSucesso.push(notificacao.id);
      } catch (error) {
        console.error(
          `[Email Error] Falha ao enviar ID ${notificacao.id}:`,
          error,
        );
        idsErro.push(notificacao.id);
      }
    }

    // 3. Atualiza os estados no banco de dados em lote (Batch Update)
    if (idsSucesso.length > 0) {
      await this.repository.atualizarStatus(idsSucesso, "enviado");
    }

    if (idsErro.length > 0) {
      await this.repository.atualizarStatus(
        idsErro,
        "erro",
        "Falha no provedor de SMTP",
      );
    }

    return idsSucesso.length;
  }
}
