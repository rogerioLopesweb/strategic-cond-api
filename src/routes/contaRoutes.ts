import { Router } from "express";
import {
  listarMinhasContas,
  criarConta,
  atualizarDadosFiscais,
  buscarContaPorId,
} from "../controllers/contaController";
import { verificarToken } from "../middlewares/authMiddleware";
import { registry } from "../config/openApiRegistry";
import {
  createContaSchema,
  updateContaSchema,
  contaIdParamSchema,
} from "../schemas/contaSchema";
import { z } from "zod";

const router = Router();

// --- Rotas ---

registry.registerPath({
  method: "get",
  path: "/api/contas",
  tags: ["Contas"],
  summary: "Lista todas as contas (PJs) vinculadas ao usuário logado",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Lista de contas retornada com sucesso",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: z.array(z.any()), // Pode-se detalhar o schema da conta se desejar
          }),
        },
      },
    },
  },
});
router.get("/", verificarToken, listarMinhasContas);

registry.registerPath({
  method: "post",
  path: "/api/contas",
  tags: ["Contas"],
  summary: 'Cria uma nova "Casca PJ" (Fricção Zero)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createContaSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Conta criada com sucesso",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.any(),
          }),
        },
      },
    },
  },
});
router.post("/", verificarToken, criarConta);

registry.registerPath({
  method: "get",
  path: "/api/contas/{id}",
  tags: ["Contas"],
  summary: "Retorna os detalhes de uma conta específica",
  security: [{ bearerAuth: [] }],
  request: {
    params: contaIdParamSchema,
  },
  responses: {
    200: {
      description: "Dados da conta retornados",
    },
    404: {
      description: "Conta não encontrada",
    },
  },
});
router.get("/:id", verificarToken, buscarContaPorId);

registry.registerPath({
  method: "patch",
  path: "/api/contas/{id}",
  tags: ["Contas"],
  summary: "Atualiza dados fiscais e financeiros da conta",
  security: [{ bearerAuth: [] }],
  request: {
    params: contaIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: updateContaSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Dados fiscais atualizados",
    },
    403: {
      description: "Permissão negada (Usuário não é o dono da conta)",
    },
  },
});
router.patch("/:id", verificarToken, atualizarDadosFiscais);

export default router;
