import nodemailer, { Transporter } from "nodemailer";
import { IMailProvider, ISendMailDTO } from "../IMailProvider";

export class NodemailerMailProvider implements IMailProvider {
  private transporter: Transporter;

  constructor() {
    // Configuração do motor de envio usando variáveis de ambiente
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendMail({ to, subject, body }: ISendMailDTO): Promise<void> {
    try {
      await this.transporter.sendMail({
        from:
          process.env.SMTP_FROM ||
          '"StrategicCond" <no-reply@strategiccondo.com>',
        to,
        subject,
        text: body, // Fallback para texto puro
        html: this.createDefaultTemplate(subject, body), // Versão HTML estilizada
      });
    } catch (error) {
      console.error("[Nodemailer Error] Erro ao enviar e-mail:", error);
      throw new Error("Falha no envio de e-mail via SMTP.");
    }
  }

  /**
   * Cria um wrapper HTML básico para o e-mail não parecer um texto de bloco de notas
   */
  private createDefaultTemplate(title: string, message: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">${title}</h2>
        <p style="font-size: 16px; color: #34495e; line-height: 1.6;">${message}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <footer style="font-size: 12px; color: #95a5a6; text-align: center;">
          Este é um aviso automático do <strong>StrategicCond</strong>. Por favor, não responda a este e-mail.
        </footer>
      </div>
    `;
  }
}
