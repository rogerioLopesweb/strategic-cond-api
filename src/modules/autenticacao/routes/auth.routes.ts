import { Router } from "express";
import { verificarToken } from "@shared/infra/http/middlewares/authMiddleware"; // Mantendo seu path original
import { registry } from "@shared/infra/http/openapi/registry";
import { loginSchema } from "../schemas/authSchema";
import { AuthController } from "../controllers/AuthController"; // ✅ Novo Controller Unificado
import { z } from "zod";

const authRoutes = Router();
const authController = new AuthController(); // ✅ Instância única

// --- Documentação da Rota de Login ---
registry.registerPath({
  method: "post",
  path: "/api/auth/login", // O prefixo /api geralmente é configurado no server, mas se precisar explícito use /api/auth/login
  summary: "Autenticar usuário",
  tags: ["Autenticação"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: loginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Usuário autenticado com sucesso",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            user: z.object({
              id: z.string().uuid(),
              nome: z.string(),
              email: z.string().email(),
              perfil: z.string(),
            }),
            token: z.string(),
          }),
        },
      },
    },
    401: {
      description: "Login ou senha incorretos",
    },
  },
});

// ✅ Rota Atualizada chamando o método login
authRoutes.post("/login", (req, res) => authController.login(req, res));

// --- Documentação da Rota de Perfil ---
registry.registerPath({
  method: "get",
  path: "/api/auth/perfil",
  summary: "Obter perfil do usuário autenticado",
  security: [{ bearerAuth: [] }],
  tags: ["Autenticação"],
  responses: {
    200: {
      description: "Perfil do usuário recuperado com sucesso",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              id: z.string().uuid(),
              nome: z.string(),
              email: z.string().email(),
              perfil: z.string(),
            }),
          }),
        },
      },
    },
    401: {
      description: "Não autorizado (Token inválido ou ausente)",
    },
  },
});

// ✅ Rota Atualizada chamando o método profile
// O "as any" ajuda o TypeScript a aceitar que o req vai ter o usuario injetado pelo middleware
authRoutes.get("/perfil", verificarToken, (req, res) =>
  authController.profile(req as any, res),
);

export default authRoutes;
