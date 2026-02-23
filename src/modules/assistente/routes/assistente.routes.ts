import { Router } from "express";
import { makeAssistenteController } from "../factories/AssistenteFactory";
import { verificarToken } from "@shared/infra/http/middlewares/authMiddleware";
import { registry } from "@shared/infra/http/openapi/registry";
import { chatAssistenteSchema } from "../schemas/assistenteSchema";
import { z } from "zod";

const router = Router();
const controller = makeAssistenteController();

// --- 1. REGISTRO OPENAPI (SWAGGER) ---

registry.registerPath({
  method: "post",
  path: "/api/assistente/chat",
  tags: ["Assistente Virtual (Otto)"],
  summary: "Envia uma mensagem para o assistente virtual baseado em IA",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: chatAssistenteSchema } },
    },
  },
  responses: {
    200: {
      description: "Resposta gerada pela inteligência artificial com sucesso",
      content: {
        "application/json": {
          schema: z.object({
            remetente: z.string().openapi({ example: "otto" }),
            texto: z.string().openapi({
              example:
                "Olá! Não temos entregas registradas para o bloco A unidade 101 hoje.",
            }),
            data_hora: z
              .string()
              .openapi({ example: "2024-05-20T14:30:00.000Z" }),
          }),
        },
      },
    },
    400: {
      description: "Erro de validação (Mensagem vazia ou sem ID do condomínio)",
    },
    401: {
      description: "Não autorizado (Token inválido)",
    },
  },
});

// --- 2. DEFINIÇÃO DAS ROTAS ---

// Rota principal de conversa com a IA
router.post("/chat", verificarToken, (req, res) => controller.chat(req, res));

const assistenteRouter = router;
export default assistenteRouter;
