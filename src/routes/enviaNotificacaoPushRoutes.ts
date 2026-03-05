import { Router } from "express";
import { processarFilaPush } from "../controllers/enviaNotificacaoPushController";
import { registry } from "../config/openApiRegistry";
import { processarFilaSchema } from "../schemas/notificacaoSchema";
import { z } from "zod";

const router = Router();

registry.registerPath({
  method: "get",
  path: "/api/notificacoes-push/processar-fila",
  tags: ["Notificações"],
  summary: "Rota oficial para ser chamada via Cron Job externo",
  description:
    "Rota oficial para ser chamada via Cron Job externo (EasyPanel/Cron) para processar notificações Push",
  request: {
    query: processarFilaSchema,
  },
  responses: {
    200: {
      description: "Fila processada com sucesso",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            total_enviados: z.number(),
            message: z.string(),
          }),
        },
      },
    },
    500: {
      description: "Erro interno do servidor",
    },
  },
});

router.get("/notificacoes-push/processar-fila", processarFilaPush);

export default router;
