import { Router } from "express";
import {
  cadastrarCondominio,
  atualizarCondominio,
  buscarCondominioPorId,
  listarCondominiosPorConta,
  listarMeusCondominios,
} from "../controllers/condominioController";
import { verificarToken } from "../middlewares/authMiddleware";
import { registry } from "../config/openApiRegistry";
import {
  createCondominioSchema,
  updateCondominioSchema,
  listCondominioSchema,
  idParamSchema,
} from "../schemas/condominioSchema";
import { z } from "zod";

const router = Router();

// --- 1. Rotas de Listagem (Específicas) ---

// --- 1. Rotas Específicas (Devem vir primeiro) ---

// Lista por conta - Rota: /api/condominios/por-conta/:id
// 1. Registro no Swagger (OpenAPI)
// 1. O MAPA (Swagger/OpenAPI)
registry.registerPath({
  method: "get",
  path: "/api/condominios/por-conta/{id}", // AJUSTADO: Aqui deve ser exatamente o caminho da rota
  tags: ["Condomínios"],
  summary: "Lista condomínios da conta (Visão Admin)",
  security: [{ bearerAuth: [] }],
  request: {
    params: idParamSchema, // Isso faz o campo {id} aparecer no Swagger para você colar o UUID
    query: listCondominioSchema, // Isso faz os filtros (cidade, page) aparecerem
  },
  responses: {
    200: { description: "Sucesso" },
  },
});

// 2. A RUA REAL (Express Router)
// Importante: O caminho aqui deve ser relativo ao que foi montado no server.ts
router.get("/por-conta/:id", verificarToken, listarCondominiosPorConta);

/// Lista meus - Rota: /api/condominios/meus
registry.registerPath({
  method: "get",
  path: "/api/condominios/meus", // Removida a barra final
  tags: ["Condomínios"],
  summary: "Lista condomínios vinculados ao usuário (Visão App)",
  security: [{ bearerAuth: [] }],
  request: { query: listCondominioSchema },
  responses: { 200: { description: "Sucesso" } },
});
router.get("/meus", verificarToken, listarMeusCondominios); // Removida a barra final

registry.registerPath({
  method: "get",
  path: "/api/condominios/{id}", // {id} aqui é o condomínio_id
  tags: ["Condomínios"],
  summary: "Busca um condomínio por ID",
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema },
  responses: {
    200: { description: "Detalhes do condomínio" },
    404: { description: "Condomínio não encontrado" },
  },
});
router.get("/:id", verificarToken, buscarCondominioPorId);

// --- 2. Rotas de Ação (Criação) ---

registry.registerPath({
  method: "post",
  path: "/api/condominios",
  tags: ["Condomínios"],
  summary: "Cadastra um novo condomínio",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: createCondominioSchema } },
    },
  },
  responses: { 201: { description: "Condomínio cadastrado com sucesso" } },
});
router.post("/", verificarToken, cadastrarCondominio);

// --- 3. Rotas Genéricas por ID (Sempre ao final) ---

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
  responses: { 200: { description: "Condomínio atualizado com sucesso" } },
});
router.put("/:id", verificarToken, atualizarCondominio);

export default router;
