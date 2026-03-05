import QRCode from "qrcode";
import { GerarQRCodeDTO } from "../schemas/qrCodeSchema";

export class QrCodeService {
  /**
   * Gera um QR Code em formato Data URL (Base64).
   */
  async gerar(dados: GerarQRCodeDTO): Promise<string> {
    try {
      const url = await QRCode.toDataURL(dados.texto, {
        width: dados.width,
        margin: dados.margin,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
      return url;
    } catch (error) {
      throw new Error("Falha interna ao gerar o QR Code.");
    }
  }
}
