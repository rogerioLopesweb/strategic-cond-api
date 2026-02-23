import { Router } from "express";
import { makeBaseConhecimentoController } from "../factories/BaseConhecimentoFactory";
import { verificarToken } from "@shared/infra/http/middlewares/authMiddleware";
import { registry } from "@shared/infra/http/openapi/registry";
import {
  createBaseConhecimentoSchema,
  listBaseConhecimentoSchema,
  updateBaseConhecimentoSchema,
} from "../schemas/baseConhecimentoSchema";
import { z } from "zod";

const router = Router();
const controller = makeBaseConhecimentoController();

// --- 1. REGISTRO OPENAPI (SWAGGER) ---

registry.registerPath({
  method: "post",
  path: "/api/base-conhecimento",
  tags: ["Base de Conhecimento"],
  summary: "Cadastra uma nova regra, FAQ ou contato útil",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: createBaseConhecimentoSchema } },
    },
  },
  responses: {
    201: { description: "Informação registrada com sucesso" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/base-conhecimento",
  tags: ["Base de Conhecimento"],
  summary: "Lista a base de conhecimento com filtros e paginação",
  security: [{ bearerAuth: [] }],
  request: { query: listBaseConhecimentoSchema },
  responses: { 200: { description: "Sucesso" } },
});

registry.registerPath({
  method: "put",
  path: "/api/base-conhecimento/{id}",
  tags: ["Base de Conhecimento"],
  summary: "Atualiza um registro da base de conhecimento",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: { "application/json": { schema: updateBaseConhecimentoSchema } },
    },
  },
  responses: {
    200: { description: "Registro atualizado com sucesso" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/base-conhecimento/{id}",
  tags: ["Base de Conhecimento"],
  summary: "Remove um registro da base de conhecimento (Soft Delete)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: { description: "Registro deletado com sucesso" },
  },
});

// --- 2. DEFINIÇÃO DAS ROTAS ---

// Cadastro e Listagem
router.post("/", verificarToken, (req, res) => controller.store(req, res));
router.get("/", verificarToken, (req, res) => controller.index(req, res));

// Gestão e Correção
router.put("/:id", verificarToken, (req, res) => controller.update(req, res));
router.delete("/:id", verificarToken, (req, res) =>
  controller.delete(req, res),
);

export default router;
