import { Request, Response } from "express";
import { NotificacaoService } from "../services/notificacaoService";
import { processarFilaSchema } from "../schemas/notificacaoSchema";

const service = new NotificacaoService();

export const processarFilaEmail = async (req: Request, res: Response) => {
  console.log("--- Execução: enviaNotificacaoEmailController iniciada ---");

  try {
    // 1. Validação Zod (limite via query string)
    const { limit } = processarFilaSchema.parse(req.query);

    // 2. Chamada ao Service
    const result = await service.processarFilaEmail(limit);

    console.log(`📧 Sucesso: ${result.sent} e-mails enviados.`);

    res.json({
      success: true,
      total_enviados: result.sent,
      message: result.message,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    console.error("❌ Erro no enviaNotificacaoEmailController:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao processar fila de e-mails.",
      error: error.message,
    });
  }
};
