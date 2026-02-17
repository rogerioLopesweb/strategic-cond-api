import { Router } from "express";
import { CondominiosFactory } from "../factories/CondominioFactory";
import { verificarToken } from "@shared/infra/http/middlewares/authMiddleware";
import { registry } from "@shared/infra/http/openapi/registry";
import {
  createCondominioSchema,
  updateCondominioSchema,
  listCondominioSchema,
  idParamSchema,
} from "../schemas/condominioSchema";

const router = Router();
const controller = CondominiosFactory.makeController();

// --- 1. DOCUMENTAÇÃO OPENAPI (SWAGGER) ---

// Lista Condomínios (Unificado)
registry.registerPath({
  method: "get",
  path: "/api/condominios",
  tags: ["Condomínios"],
  summary:
    "Lista condomínios. A lista é filtrada com base no perfil do usuário (admin vs. vinculado).",
  security: [{ bearerAuth: [] }],
  request: { query: listCondominioSchema },
  responses: { 200: { description: "Sucesso" } },
});

// Cadastrar
registry.registerPath({
  method: "post",
  path: "/api/condominios",
  tags: ["Condomínios"],
  summary: "Cadastra um novo condomínio e cria vínculo com o criador",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: createCondominioSchema } },
    },
  },
  responses: { 201: { description: "Condomínio cadastrado" } },
});

// Buscar por ID
registry.registerPath({
  method: "get",
  path: "/api/condominios/{id}",
  tags: ["Condomínios"],
  summary: "Busca detalhes de um condomínio por ID",
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema },
  responses: {
    200: { description: "Sucesso" },
    404: { description: "Não encontrado" },
  },
});

// Atualizar
registry.registerPath({
  method: "put",
  path: "/api/condominios/{id}",
  tags: ["Condomínios"],
  summary: "Atualiza dados de um condomínio",
  security: [{ bearerAuth: [] }],
  request: {
    params: idParamSchema,
    body: {
      content: { "application/json": { schema: updateCondominioSchema } },
    },
  },
  responses: { 200: { description: "Atualizado com sucesso" } },
});

// --- 2. DEFINIÇÃO DAS ROTAS (EXPRESS) ---

router.use(verificarToken); // Aplica o middleware de autenticação a todas as rotas

router.get("/", (req, res) => controller.index(req, res)); // Rota de listagem unificada
router.post("/", (req, res) => controller.store(req, res));
router.get("/:id", (req, res) => controller.show(req, res));
router.put("/:id", (req, res) => controller.update(req, res));

export default router;
