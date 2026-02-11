import { Router } from "express";
import { login, getPerfil } from "../controllers/authController";
import { verificarToken } from "../middlewares/authMiddleware";
import { registry } from "../config/openApiRegistry";
import { loginSchema } from "../schemas/authSchema";
import { z } from "zod";

const router = Router();

registry.registerPath({
  method: "post",
  path: "/api/auth/login",
  tags: ["Autenticação"],
  summary: "Realiza login do usuário",
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
      description: "Login realizado com sucesso",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            usuario: z.object({
              id: z.string().uuid(),
              nome: z.string(),
              token: z.string(),
            }),
          }),
        },
      },
    },
    401: {
      description: "Credenciais inválidas",
    },
  },
});

router.post("/login", login);

registry.registerPath({
  method: "get",
  path: "/api/auth/perfil",
  tags: ["Autenticação"],
  summary: "Retorna os dados do usuário logado",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Dados do perfil recuperados com sucesso",
    },
    401: {
      description: "Token não fornecido ou inválido",
    },
  },
});

router.get("/perfil", verificarToken, getPerfil);

export default router;
