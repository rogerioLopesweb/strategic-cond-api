import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { IPushProvider, ISendPushDTO } from "../IPushProvider";

export class ExpoPushProvider implements IPushProvider {
  private expo = new Expo();

  async sendPush(
    messages: ISendPushDTO[],
  ): Promise<{ sent: number; failed: string[] }> {
    const expoMessages: ExpoPushMessage[] = messages.map((msg) => ({
      to: msg.to,
      sound: "default",
      title: msg.title,
      body: msg.body,
      data: msg.data,
      priority: "high",
    }));

    const chunks = this.expo.chunkPushNotifications(expoMessages);
    let sentCount = 0;
    const failedIds: string[] = [];

    for (const chunk of chunks) {
      try {
        await this.expo.sendPushNotificationsAsync(chunk);
        sentCount += chunk.length;
      } catch (error) {
        console.error("Erro no chunk Expo:", error);
      }
    }

    return { sent: sentCount, failed: failedIds };
  }
}
