export interface ISendPushDTO {
  to: string;    // Token do Expo (ou FCM)
  title: string; // Título da notificação
  body: string;  // Mensagem principal
  
  /** * 🎯 Metadados para Deep Linking
   * Enviamos os IDs aqui para que o Listener no App saiba para onde navegar.
   */
  data?: {
    entrega_id?: string;
    visita_id?: string;
    // Permite outros campos caso o Otto cresça (ex: assembleia_id, chat_id)
    [key: string]: any; 
  };

  /** Opcional: Para casos de emergência ou avisos críticos */
  priority?: 'default' | 'normal' | 'high';
}

export interface IPushProvider {
  sendPush(
    messages: ISendPushDTO[],
  ): Promise<{ sent: number; failed: string[] }>;
}