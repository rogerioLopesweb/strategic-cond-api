import { Router } from "express";
import { processarFilaEmail } from "../controllers/enviaNotificacaoEmailController";
import { registry } from "../config/openApiRegistry";
import { processarFilaSchema } from "../schemas/notificacaoSchema";
import { z } from "zod";

const router = Router();

registry.registerPath({
  method: "get",
  path: "/api/notificacoes-email/processar-fila",
  tags: ["Notificações"],
  summary: "Processa fila de notificações por e-mail",
  description: "Rota para processar a fila de notificações por e-mail",
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

router.get("/processar-fila", processarFilaEmail);

export default router;
