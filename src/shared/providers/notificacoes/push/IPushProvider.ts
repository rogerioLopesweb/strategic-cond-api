export interface ISendPushDTO {
  to: string;
  title: string;
  body: string;
  data?: any;
}

export interface IPushProvider {
  sendPush(
    messages: ISendPushDTO[],
  ): Promise<{ sent: number; failed: string[] }>;
}
