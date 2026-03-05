import { Router } from "express";
import { makeAssistenteController } from "../factories/AssistenteFactory"; // Confirme o caminho da factory
import { verificarToken } from "@shared/infra/http/middlewares/authMiddleware";
import { registry } from "@shared/infra/http/openapi/registry";
import { chatAssistenteSchema } from "../schemas/assistenteSchema";
import { z } from "zod";

const router = Router();
const controller = makeAssistenteController();

// =========================================================
// 1. REGISTRO OPENAPI (SWAGGER)
// =========================================================

// 👉 Swagger: POST /chat (Enviar mensagem)
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
            sessao_id: z
              .string()
              .uuid()
              .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
            texto: z.string().openapi({
              example:
                "Olá Maria! O regimento interno diz que a piscina fecha às 22h. Posso ajudar com mais alguma coisa?",
            }),
            data_hora: z
              .string()
              .openapi({ example: new Date().toISOString() }),
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

// 👉 Swagger: GET /chat/historico (Recuperar conversa ativa)
registry.registerPath({
  method: "get",
  path: "/api/assistente/chat/historico",
  tags: ["Assistente Virtual (Otto)"],
  summary: "Busca o histórico da conversa ativa do usuário no condomínio",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Histórico recuperado com sucesso",
      content: {
        "application/json": {
          schema: z.object({
            sessao_id: z.string().uuid().nullable().openapi({
              example: "123e4567-e89b-12d3-a456-426614174000",
              description: "Retorna nulo se não houver conversa ativa.",
            }),
            mensagens: z.array(
              z.object({
                id: z.string().uuid(),
                remetente: z
                  .enum(["usuario", "otto"])
                  .openapi({ example: "usuario" }),
                texto: z
                  .string()
                  .openapi({ example: "Qual o horário da piscina?" }),
                data_hora: z
                  .string()
                  .openapi({ example: new Date().toISOString() }),
              }),
            ),
          }),
        },
      },
    },
    401: {
      description: "Não autorizado (Token inválido)",
    },
  },
});

// =========================================================
// 2. DEFINIÇÃO DAS ROTAS (EXPRESS)
// =========================================================

// Rota principal de conversa com a IA
router.post("/chat", verificarToken, (req, res) => controller.chat(req, res));

// 👇 NOVA ROTA: Busca o histórico ao abrir a tela
router.get("/chat/historico", verificarToken, (req, res) =>
  controller.historico(req, res),
);

const assistenteRouter = router;
export default assistenteRouter;
