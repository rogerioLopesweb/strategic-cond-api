import nodemailer, { Transporter } from "nodemailer";
import QRCode from "qrcode";
import { IMailProvider, ISendMailDTO } from "../IMailProvider";

export class NodemailerMailProvider implements IMailProvider {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendMail(data: ISendMailDTO): Promise<void> {
    const { to, subject, body, id_entrega, visita_id, template } = data;

    try {
      const mailFrom = process.env.SMTP_FROM || `"Otto" <${process.env.SMTP_USER}>`;
      let htmlContent: string;
      const attachments: any[] = data.attachments || [];

      // 🔄 Lógica de Seleção de Template (Pente Fino)
      if (template === "entrega" && id_entrega) {
        // --- Fluxo de Encomenda ---
        const qrCodeBuffer = await QRCode.toBuffer(id_entrega, {
          color: { dark: "#000000", light: "#FFFFFF" },
          width: 600,
          margin: 4
        });

        htmlContent = this.createEntregaQRCodeTemplate(id_entrega, subject, body);
        
        attachments.push({
          filename: `QR_CODE_RETIRADA_${id_entrega.substring(0, 8)}.png`,
          content: qrCodeBuffer,
          contentDisposition: 'attachment'
        });

      } else if (template === "visita") {
        // --- Fluxo de Visitante ---
        htmlContent = this.createVisitaTemplate(visita_id || "N/A", subject, body);
      } else {
        // --- Fluxo Padrão ---
        htmlContent = this.createDefaultTemplate(subject, body);
      }

      await this.transporter.sendMail({
        from: mailFrom,
        to,
        subject,
        text: body,
        html: htmlContent,
        attachments: attachments,
      });

    } catch (error: any) {
      console.error("[StrategicCond - SMTP Error]:", error);
      throw new Error("Erro no processamento da fila de e-mail.");
    }
  }

  /**
   * 📄 Template 01: Encomenda (Foco no Anexo)
   */
  private createEntregaQRCodeTemplate(id_entrega: string, title: string, message: string): string {
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #202045; padding: 25px; text-align: center;">
           <h1 style="color: #ffffff; margin: 0; font-size: 20px;">${title}</h1>
        </div>
        <div style="padding: 35px; text-align: center;">
          <p style="font-size: 16px; color: #444444; line-height: 1.6; text-align: left; margin-bottom: 25px;">
            ${message}
          </p>
          <div style="background-color: #f0f4f8; padding: 25px; border-radius: 12px; border: 2px solid #202045;">
            <p style="font-size: 18px; color: #202045; font-weight: bold; margin: 0;">📦 Baixe o QR Code em anexo</p>
            <p style="font-size: 15px; color: #444444; margin-top: 10px; line-height: 1.4;">
              Mostre para leitura na portaria e retire a encomenda.
            </p>
          </div>
          <p style="font-size: 11px; color: #aaaaaa; margin-top: 30px;">REF: ${id_entrega}</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 15px; text-align: center;">
          <footer style="font-size: 11px; color: #aaaaaa;">© StrategicFlow Otto - Gestão Inteligente</footer>
        </div>
      </div>
    `;
  }

  /**
   * 📄 Template 02: Visitante (Informativo e Seguro)
   */
  private createVisitaTemplate(visita_id: string, title: string, message: string): string {
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #202045; padding: 25px; text-align: center;">
           <h1 style="color: #ffffff; margin: 0; font-size: 20px;">${title}</h1>
        </div>
        <div style="padding: 35px; text-align: center;">
          <p style="font-size: 16px; color: #444444; line-height: 1.6; text-align: left; margin-bottom: 25px;">
            ${message}
          </p>
          <div style="background-color: #fff9db; padding: 25px; border-radius: 12px; border: 2px solid #fcc419;">
            <p style="font-size: 18px; color: #856404; font-weight: bold; margin: 0;">👤 Entrada Registrada</p>
            <p style="font-size: 15px; color: #444444; margin-top: 10px; line-height: 1.4;">
              Seu visitante/prestador de serviço acabou de acessar o condomínio.
            </p>
          </div>
          <p style="font-size: 11px; color: #aaaaaa; margin-top: 30px;">REGISTRO DE VISITA: ${visita_id}</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 15px; text-align: center;">
          <footer style="font-size: 11px; color: #aaaaaa;">© StrategicFlow Otto - Portaria 24h</footer>
        </div>
      </div>
    `;
  }

  /**
   * 📄 Template 03: Padrão (Avisos Gerais)
   */
  private createDefaultTemplate(title: string, message: string): string {
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #202045; padding: 25px; text-align: center;">
           <h1 style="color: #ffffff; margin: 0; font-size: 20px;">${title}</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #444444; line-height: 1.6;">${message}</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 15px; text-align: center;">
          <footer style="font-size: 11px; color: #aaaaaa;">© StrategicFlow Otto</footer>
        </div>
      </div>
    `;
  }
}