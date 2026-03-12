import { NotificacaoRepository } from "../repositories/NotificacaoRepository";
import { IMailProvider } from "@shared/providers/notificacoes/email/IMailProvider";

export class ProcessarFilaEmailUseCase {
  constructor(
    private repository: NotificacaoRepository,
    private mailProvider: IMailProvider,
  ) {}

  async execute(limit: number): Promise<number> {
    // 1. Busca notificações (Certifique-se que o Repo traga entrega_id e visita_id)
    const pendentes = await this.repository.buscarPendentes("email", limit);

    if (!pendentes || pendentes.length === 0) {
      return 0;
    }

    const idsSucesso: string[] = [];
    const idsErro: string[] = [];

    // 2. Processamento Sequencial (Respeitando limites de SMTP)
    for (const notificacao of pendentes) {
      try {
        // 🎯 Lógica de Identificação do Template (Pente Fino)
        let templateEscolhido: 'default' | 'entrega' | 'visita' = 'default';
        
        if (notificacao.entrega_id) {
          templateEscolhido = 'entrega';
        } else if (notificacao.visita_id) {
          templateEscolhido = 'visita';
        }

        await this.mailProvider.sendMail({
          to: notificacao.destino,
          subject: notificacao.titulo,
          body: notificacao.mensagem,
          id_entrega: notificacao.entrega_id,
          visita_id: notificacao.visita_id, // ✅ Agora enviamos o ID da visita também
          template: templateEscolhido,     // ✅ Template dinâmico
        });

        idsSucesso.push(notificacao.id);
      } catch (error: any) {
        console.error(
          `[Otto - Queue Error] Falha na notificação ${notificacao.id}:`,
          error?.message || error,
        );
        idsErro.push(notificacao.id);
      }
    }

    // 3. Atualização de status em lote
    const updates = [];

    if (idsSucesso.length > 0) {
      updates.push(this.repository.atualizarStatus(idsSucesso, "enviado"));
    }

    if (idsErro.length > 0) {
      updates.push(
        this.repository.atualizarStatus(
          idsErro,
          "erro",
          "Falha no processamento SMTP ou identidade de remetente",
        )
      );
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }

    return idsSucesso.length;
  }
}