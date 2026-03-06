import { Router } from "express";
import { makeBaseConhecimentoController } from "../factories/BaseConhecimentoFactory";
import { verificarToken } from "@shared/infra/http/middlewares/authMiddleware";
import { registry } from "@shared/infra/http/openapi/registry";
import {
  createBaseConhecimentoBodySchema,
  listBaseConhecimentoQuerySchema,
  updateBaseConhecimentoBodySchema,
  baseConhecimentoParamsSchema, // ✅ Novo
  baseConhecimentoResponseSchema // ✅ Novo
} from "../schemas/baseConhecimentoSchema";

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
      content: { "application/json": { schema: createBaseConhecimentoBodySchema } },
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
  request: { query: listBaseConhecimentoQuerySchema },
  responses: { 200: { description: "Sucesso" } },
});

// ✅ NOVO: Registro do GET Individual (Resolve o 404 do Frontend)
registry.registerPath({
  method: "get",
  path: "/api/base-conhecimento/{id}",
  tags: ["Base de Conhecimento"],
  summary: "Busca um registro específico pelo ID",
  security: [{ bearerAuth: [] }],
  request: {
    params: baseConhecimentoParamsSchema,
  },
  responses: {
    200: { 
      description: "Sucesso",
      content: { "application/json": { schema: baseConhecimentoResponseSchema } }
    },
    404: { description: "Registro não encontrado" }
  },
});

registry.registerPath({
  method: "put",
  path: "/api/base-conhecimento/{id}",
  tags: ["Base de Conhecimento"],
  summary: "Atualiza um registro da base de conhecimento",
  security: [{ bearerAuth: [] }],
  request: {
    params: baseConhecimentoParamsSchema,
    body: {
      content: { "application/json": { schema: updateBaseConhecimentoBodySchema } },
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
    params: baseConhecimentoParamsSchema,
  },
  responses: {
    200: { description: "Registro deletado com sucesso" },
  },
});

// --- 2. DEFINIÇÃO DAS ROTAS ---

// Cadastro e Listagem
router.post("/", verificarToken, (req, res) => controller.store(req, res));
router.get("/", verificarToken, (req, res) => controller.index(req, res));

// ✅ NOVO: Rota para buscar detalhe (O "Culpado" pelo erro no Frontend!)
router.get("/:id", verificarToken, (req, res) => controller.show(req, res));

// Gestão e Correção
router.put("/:id", verificarToken, (req, res) => controller.update(req, res));
router.delete("/:id", verificarToken, (req, res) => controller.delete(req, res));

export default router;