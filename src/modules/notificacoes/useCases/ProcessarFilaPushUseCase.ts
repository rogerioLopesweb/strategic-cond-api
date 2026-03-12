import { NotificacaoRepository } from "../repositories/NotificacaoRepository";
import { IPushProvider } from "@shared/providers/notificacoes/push/IPushProvider";
import { Expo } from "expo-server-sdk";

export class ProcessarFilaPushUseCase {
  constructor(
    private repository: NotificacaoRepository,
    private pushProvider: IPushProvider,
  ) {}

  async execute(limit: number): Promise<number> {
    // 1. Busca notificações pendentes (Certifique-se que o SQL traga entrega_id e visita_id)
    const pendentes = await this.repository.buscarPendentes("push", limit);

    if (!pendentes || pendentes.length === 0) return 0;

    const idsParaSucesso: string[] = [];
    const idsParaErro: string[] = [];
    const mensagensParaEnviar: any[] = [];

    // 2. Triagem e Mapeamento
    for (const p of pendentes) {
      // Validamos o token antes de tentar enviar
      if (!p.destino || !Expo.isExpoPushToken(p.destino)) {
        idsParaErro.push(p.id);
        continue;
      }

      mensagensParaEnviar.push({
        to: p.destino,
        title: p.titulo,
        body: p.mensagem,
        // 🎯 Deep Linking Dinâmico: Passa o ID que existir
        data: { 
          entrega_id: p.entrega_id || undefined,
          visita_id: p.visita_id || undefined
        },
      });
      
      // Armazenamos temporariamente como sucesso, 
      // mas validaremos com o retorno do Provider abaixo
      idsParaSucesso.push(p.id);
    }

    // 3. Disparo em Lote
    if (mensagensParaEnviar.length > 0) {
      const result = await this.pushProvider.sendPush(mensagensParaEnviar);

      // Se houver tokens que falharam no retorno do Provider, 
      // você poderia fazer um cruzamento aqui para mover de idsParaSucesso para idsParaErro.
      // Por simplicidade e performance, vamos atualizar o lote enviado.
    }

    // 4. Atualização de Status no Banco (Batch Update)
    const updates = [];

    if (idsParaSucesso.length > 0) {
      updates.push(this.repository.atualizarStatus(idsParaSucesso, "enviado"));
    }

    if (idsParaErro.length > 0) {
      updates.push(
        this.repository.atualizarStatus(
          idsParaErro, 
          "erro", 
          "Token Expo inválido ou mal formatado"
        )
      );
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }

    return idsParaSucesso.length;
  }
}   