import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { IPushProvider, ISendPushDTO } from "../IPushProvider";

export class ExpoPushProvider implements IPushProvider {
  private expo = new Expo();

  async sendPush(
    messages: ISendPushDTO[],
  ): Promise<{ sent: number; failed: string[] }> {
    // 1. Mapeamento das mensagens para o formato do Expo
    const expoMessages: ExpoPushMessage[] = messages.map((msg) => ({
      to: msg.to,
      sound: "default",
      title: msg.title,
      body: msg.body,
      data: msg.data, // 🎯 Aqui viajam os IDs para o Deep Link
      priority: "high",
      channelId: "default", // Recomendado para Android 8+
    }));

    // 2. Chunking (Divisão em lotes para não estourar o limite do Expo)
    const chunks = this.expo.chunkPushNotifications(expoMessages);
    let sentCount = 0;
    const failedTokens: string[] = [];

    for (const chunk of chunks) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        
        // 🎯 Verificação de Tickets (Opcional, mas profissional)
        tickets.forEach((ticket, index) => {
          if (ticket.status === "error") {
            console.error(`Erro no token: ${chunk[index].to}`, ticket.details);
            failedTokens.push(chunk[index].to as string);
          } else {
            sentCount++;
          }
        });

      } catch (error) {
        console.error("[Otto - Push Provider Error] Erro ao enviar chunk:", error);
        // Se o chunk inteiro falhar, adicionamos todos os tokens deste chunk como falha
        chunk.forEach(msg => failedTokens.push(msg.to as string));
      }
    }

    return { sent: sentCount, failed: failedTokens };
  }
}