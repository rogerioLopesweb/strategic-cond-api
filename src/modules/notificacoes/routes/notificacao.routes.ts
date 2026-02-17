import { Router } from "express";
import { makeNotificacaoController } from "../factories/NotificacaoFactory";
import { registry } from "@shared/infra/http/openapi/registry";
import { processarFilaSchema } from "../schemas/notificacaoSchema";
import { z } from "zod";

const router = Router();
const controller = makeNotificacaoController();

// --- 1. REGISTRO OPENAPI (SWAGGER) ---

registry.registerPath({
  method: "get",
  path: "/api/notificacoes/email/processar-fila",
  tags: ["Notificações"],
  summary: "Processa a fila de e-mails pendentes",
  description:
    "Geralmente chamada por um Cron Job externo para disparar os e-mails do sistema.",
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
  },
});

registry.registerPath({
  method: "get",
  path: "/api/notificacoes/push/processar-fila",
  tags: ["Notificações"],
  summary: "Processa a fila de notificações Push (Expo)",
  description:
    "Dispara as notificações push pendentes para os dispositivos dos moradores.",
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
  },
});

// --- 2. DEFINIÇÃO DAS ROTAS ---

/**
 * 💡 Dica: Em produção, você pode adicionar um middleware de "Secret Token"
 * nessas rotas para garantir que apenas o seu Cron Job consiga chamá-las.
 */
router.get("/email/processar-fila", (req, res) =>
  controller.processarEmail(req, res),
);
router.get("/push/processar-fila", (req, res) =>
  controller.processarPush(req, res),
);

export default router;
