import { Router } from "express";
import { verificarToken } from "@shared/infra/http/middlewares/authMiddleware";
import { registry } from "@shared/infra/http/openapi/registry";
import {
  createContaSchema,
  updateContaSchema,
  contaIdParamSchema,
} from "../schemas/contaSchema";
import { ContasFactory } from "../factories/ContaFactory";

const router = Router();
const controller = ContasFactory.makeController();

// --- DOCUMENTAÇÃO (OpenAPI) ---

// 1. LISTAR
registry.registerPath({
  method: "get",
  path: "/api/contas",
  tags: ["Contas"],
  summary: "Lista as contas do usuário logado",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "Lista de contas" } },
});

// 2. CRIAR (Usa o createContaSchema)
registry.registerPath({
  method: "post",
  path: "/api/contas",
  tags: ["Contas"],
  summary: "Cria uma nova conta (Casca PJ)",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: createContaSchema } },
    },
  },
  responses: { 201: { description: "Conta criada" } },
});

// 3. EXIBIR (Usa o contaIdParamSchema)
registry.registerPath({
  method: "get",
  path: "/api/contas/{id}",
  tags: ["Contas"],
  summary: "Busca detalhes de uma conta",
  security: [{ bearerAuth: [] }],
  request: {
    params: contaIdParamSchema,
  },
  responses: { 200: { description: "Detalhes da conta" } },
});

// 4. ATUALIZAR (Usa o contaIdParamSchema e o updateContaSchema)
registry.registerPath({
  method: "patch",
  path: "/api/contas/{id}",
  tags: ["Contas"],
  summary: "Atualiza dados fiscais da conta",
  security: [{ bearerAuth: [] }],
  request: {
    params: contaIdParamSchema,
    body: {
      content: { "application/json": { schema: updateContaSchema } },
    },
  },
  responses: { 200: { description: "Conta atualizada" } },
});

// --- ROTAS DO EXPRESS ---

router.get("/", verificarToken, (req, res) => controller.index(req, res));
router.post("/", verificarToken, (req, res) => controller.store(req, res));
router.get("/:id", verificarToken, (req, res) => controller.show(req, res));
router.patch("/:id", verificarToken, (req, res) => controller.update(req, res));

export default router;
