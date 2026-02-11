import { Router } from "express";
import { gerarQRCode } from "../controllers/qrCodeController";
import { verificarToken } from "../middlewares/authMiddleware";
import { registry } from "../config/openApiRegistry";
import { gerarQRCodeSchema } from "../schemas/qrCodeSchema";
import { z } from "zod";

const router = Router();

registry.registerPath({
  method: "post",
  path: "/api/qrcode",
  tags: ["QR Code"],
  summary: "Gera um QR Code genérico",
  description: "Gera um QR Code em Base64 a partir de um texto ou URL.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: gerarQRCodeSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "QR Code gerado com sucesso",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            qr_code_url: z
              .string()
              .openapi({ description: "Data URL do QR Code (Base64)" }),
          }),
        },
      },
    },
    401: {
      description: "Não autorizado",
    },
    500: {
      description: "Erro interno do servidor",
    },
  },
});

router.post("/", verificarToken, gerarQRCode);

export default router;
