import { Request, Response } from "express";
import { ProcessarFilaEmailUseCase } from "../useCases/ProcessarFilaEmailUseCase";
import { ProcessarFilaPushUseCase } from "../useCases/ProcessarFilaPushUseCase";
import { processarFilaSchema } from "../schemas/notificacaoSchema";

export class NotificacaoController {
  constructor(
    private processarFilaEmailUseCase: ProcessarFilaEmailUseCase,
    private processarFilaPushUseCase: ProcessarFilaPushUseCase,
  ) {}

  /**
   * 📧 Processar fila de e-mails
   * Geralmente chamada por um Cron Job ou webhook externo
   */
  public async processarEmail(req: Request, res: Response) {
    // 1. Validação do limite vindo da query string
    const { limit } = processarFilaSchema.parse(req.query);

    // 2. Execução do Use Case
    const totalEnviados = await this.processarFilaEmailUseCase.execute(limit);

    return res.json({
      success: true,
      total_enviados: totalEnviados,
      message:
        totalEnviados > 0
          ? `${totalEnviados} e-mails processados com sucesso.`
          : "Nenhum e-mail pendente na fila.",
    });
  }

  /**
   * 📱 Processar fila de notificações Push (Expo)
   */
  public async processarPush(req: Request, res: Response) {
    // 1. Validação do limite
    const { limit } = processarFilaSchema.parse(req.query);

    // 2. Execução do Use Case
    const totalEnviados = await this.processarFilaPushUseCase.execute(limit);

    return res.json({
      success: true,
      total_enviados: totalEnviados,
      message:
        totalEnviados > 0
          ? `${totalEnviados} notificações push enviadas.`
          : "Nenhuma notificação push pendente.",
    });
  }
}
