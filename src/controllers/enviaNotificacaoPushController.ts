import { Request, Response } from "express";
import { NotificacaoService } from "../services/notificacaoService";
import { processarFilaSchema } from "../schemas/notificacaoSchema";

const service = new NotificacaoService();

export const processarFilaPush = async (req: Request, res: Response) => {
  console.log("--- Execução: enviaNotificacaoPushController iniciada ---");

  try {
    // 1. Validação Zod (opcional, para configurar limite via query)
    const { limit } = processarFilaSchema.parse(req.query);

    // 2. Chamada ao Service
    const result = await service.processarFilaPush(limit);

    console.log(`✅ Sucesso: ${result.sent} notificações enviadas.`);

    res.json({
      success: true,
      total_enviados: result.sent,
      message: result.message,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    console.error("❌ Erro no enviaNotificacaoPushController:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao processar fila.",
      error: error.message,
    });
  }
};
