import { Request, Response } from "express";
import { QrCodeService } from "../services/qrCodeService";
import { gerarQRCodeSchema } from "../schemas/qrCodeSchema";
import { UsuarioAuth } from "../schemas/authSchema";

const service = new QrCodeService();

interface AuthRequest extends Request {
  usuario?: UsuarioAuth;
}

export const gerarQRCode = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Validação Zod
    const dados = gerarQRCodeSchema.parse(req.body);

    // 2. Segurança: Apenas usuários autenticados podem gerar QR Codes
    if (!req.usuario) {
      return res
        .status(401)
        .json({ success: false, message: "Não autorizado." });
    }

    // 3. Chamada ao Service
    const qrCodeUrl = await service.gerar(dados);

    res.json({ success: true, qr_code_url: qrCodeUrl });
  } catch (error: any) {
    if (error.name === "ZodError")
      return res.status(400).json({ success: false, errors: error.errors });
    res.status(500).json({ success: false, error: error.message });
  }
};
