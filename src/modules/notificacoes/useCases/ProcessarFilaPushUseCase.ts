import { NotificacaoRepository } from "../repositories/NotificacaoRepository";
import { IPushProvider } from "@shared/providers/notificacoes/push/IPushProvider";
import { Expo } from "expo-server-sdk";

export class ProcessarFilaPushUseCase {
  constructor(
    private repository: NotificacaoRepository,
    private pushProvider: IPushProvider,
  ) {}

  async execute(limit: number) {
    const pendentes = await this.repository.buscarPendentes("push", limit);

    if (pendentes.length === 0) return 0;

    const mensagensValidas = pendentes
      .filter((p) => Expo.isExpoPushToken(p.expo_push_token))
      .map((p) => ({
        to: p.expo_push_token,
        title: p.titulo,
        body: p.mensagem,
        data: { entrega_id: p.entrega_id },
      }));

    const result = await this.pushProvider.sendPush(mensagensValidas);

    if (result.sent > 0) {
      const idsSucesso = pendentes.map((p) => p.id); // Lógica simplificada
      await this.repository.atualizarStatus(idsSucesso, "enviado");
    }

    return result.sent;
  }
}
