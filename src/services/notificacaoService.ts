import pool from "../config/db";
import { Expo, ExpoPushMessage } from "expo-server-sdk";
import nodemailer from "nodemailer";

export class NotificacaoService {
  private expo = new Expo();

  /**
   * Processa a fila de notificações pendentes.
   * @param limit Número máximo de notificações a processar nesta execução.
   */
  async processarFilaPush(limit: number) {
    const client = await pool.connect();
    try {
      // 1. Busca notificações pendentes
      const query = `
                SELECT n.*, u.expo_push_token 
                FROM notificacoes n
                JOIN usuarios u ON n.usuario_id = u.id
                WHERE n.status = 'pendente' 
                AND n.canal = 'push' 
                AND u.expo_push_token IS NOT NULL
                LIMIT $1
            `;

      const result = await client.query(query, [limit]);

      if (result.rows.length === 0) {
        return { sent: 0, message: "Fila vazia." };
      }

      let messages: ExpoPushMessage[] = [];
      const idsProcessados: string[] = [];
      const idsErro: string[] = [];

      for (let row of result.rows) {
        // Validação de segurança do token Expo
        if (!Expo.isExpoPushToken(row.expo_push_token)) {
          idsErro.push(row.id);
          continue;
        }

        messages.push({
          to: row.expo_push_token,
          sound: "default",
          title: row.titulo,
          body: row.mensagem,
          data: { entrega_id: row.entrega_id },
          priority: "high",
          // @ts-ignore - Propriedade específica do Android
          android: {
            channelId: "entregas",
          },
        });
        idsProcessados.push(row.id);
      }

      // 2. Atualiza tokens inválidos (Batch Update)
      if (idsErro.length > 0) {
        await client.query(
          "UPDATE notificacoes SET status = 'erro', erro_log = 'Token inválido' WHERE id = ANY($1)",
          [idsErro],
        );
      }

      // 3. Envio em lotes (chunks) para a API da Expo
      let chunks = this.expo.chunkPushNotifications(messages);
      for (let chunk of chunks) {
        try {
          await this.expo.sendPushNotificationsAsync(chunk);
        } catch (error) {
          console.error("Erro ao enviar chunk para Expo:", error);
          // Em produção, poderíamos marcar esses IDs específicos como erro de envio
        }
      }

      // 4. Atualiza o status para 'enviado'
      if (idsProcessados.length > 0) {
        await client.query(
          "UPDATE notificacoes SET status = 'enviado', data_envio = NOW() WHERE id = ANY($1)",
          [idsProcessados],
        );
      }

      return {
        sent: idsProcessados.length,
        message: "Processamento concluído.",
      };
    } finally {
      client.release();
    }
  }

  /**
   * Processa a fila de e-mails pendentes.
   */
  async processarFilaEmail(limit: number) {
    const client = await pool.connect();

    // Configuração do Transporter (Idealmente viria de variáveis de ambiente)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    try {
      // 1. Busca notificações de e-mail pendentes
      // Assume-se que o campo 'destino' contém o e-mail do usuário
      const query = `
                SELECT id, titulo, mensagem, destino 
                FROM notificacoes 
                WHERE status = 'pendente' 
                AND canal = 'email' 
                LIMIT $1
            `;

      const result = await client.query(query, [limit]);

      if (result.rows.length === 0) {
        return { sent: 0, message: "Fila de e-mails vazia." };
      }

      const idsProcessados: string[] = [];
      const idsErro: string[] = [];

      for (let row of result.rows) {
        try {
          await transporter.sendMail({
            from:
              process.env.SMTP_FROM ||
              '"StrategicCondo" <no-reply@strategiccondo.com>',
            to: row.destino,
            subject: row.titulo,
            text: row.mensagem, // Versão texto puro
            html: `<div style="font-family: sans-serif;"><h2>${row.titulo}</h2><p>${row.mensagem}</p></div>`, // Versão HTML simples
          });
          idsProcessados.push(row.id);
        } catch (error) {
          console.error(`Erro ao enviar email para ID ${row.id}:`, error);
          idsErro.push(row.id);
        }
      }

      // 2. Atualiza status (Batch Update para sucesso)
      if (idsProcessados.length > 0) {
        await client.query(
          "UPDATE notificacoes SET status = 'enviado', data_envio = NOW() WHERE id = ANY($1)",
          [idsProcessados],
        );
      }

      // 3. Atualiza status para erro
      if (idsErro.length > 0) {
        await client.query(
          "UPDATE notificacoes SET status = 'erro', erro_log = 'Falha no envio SMTP' WHERE id = ANY($1)",
          [idsErro],
        );
      }

      return {
        sent: idsProcessados.length,
        message: "Processamento de e-mails concluído.",
      };
    } finally {
      client.release();
    }
  }
}
