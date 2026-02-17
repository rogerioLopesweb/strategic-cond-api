import { Router } from "express";
import { makeUnidadeController } from "../factories/UnidadeFactory";
import { verificarToken } from "@shared/infra/http/middlewares/authMiddleware";
import { registry } from "@shared/infra/http/openapi/registry"; // 🔍 Ajustado para o caminho correto da infra
import {
  listUnidadeSchema,
  gerarUnidadesSchema,
  vincularMoradorSchema,
  vincularMoradorPorTextoSchema,
  atualizarStatusVinculoSchema,
  buscarMoradoresSchema,
} from "../schemas/unidadeSchema";

const router = Router();
const controller = makeUnidadeController();

// --- 1. REGISTRO NO OPENAPI (SWAGGER) ---

// Listagem de Unidades
registry.registerPath({
  method: "get",
  path: "/api/unidades",
  tags: ["Unidades"],
  summary: "Lista unidades com filtros e paginação",
  security: [{ bearerAuth: [] }],
  request: { query: listUnidadeSchema },
  responses: { 200: { description: "Lista de unidades recuperada" } },
});

// Geração em Massa
registry.registerPath({
  method: "post",
  path: "/api/unidades/gerar-unidades",
  tags: ["Unidades"],
  summary: "Gera blocos e unidades em massa",
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: gerarUnidadesSchema } } },
  },
  responses: { 200: { description: "Unidades geradas com sucesso" } },
});

// Vínculo via ID (UUID)
registry.registerPath({
  method: "post",
  path: "/api/unidades/vincular-morador",
  tags: ["Unidades"],
  summary: "Vincula morador usando o ID da Unidade",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: vincularMoradorSchema } },
    },
  },
  responses: { 200: { description: "Morador vinculado com sucesso" } },
});

/** * 🔥 ADICIONADO: Vínculo via Texto (Bloco/Número)
 * Resolve o erro de 'vincularMoradorPorTextoSchema is defined but never used'
 */
registry.registerPath({
  method: "post",
  path: "/api/unidades/vincular-morador-bloco",
  tags: ["Unidades"],
  summary: "Vincula morador por Bloco e Número",
  description:
    "Permite vincular sem o ID da unidade, usando apenas a identificação textual.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: vincularMoradorPorTextoSchema },
      },
    },
  },
  responses: { 200: { description: "Vínculo textual criado com sucesso" } },
});

// Listagem de Moradores da Unidade
registry.registerPath({
  method: "get",
  path: "/api/unidades/moradores-vinculados",
  tags: ["Unidades"],
  summary: "Lista moradores ativos de uma unidade",
  security: [{ bearerAuth: [] }],
  request: { query: buscarMoradoresSchema },
  responses: { 200: { description: "Sucesso" } },
});

// Atualizar Status (Saída/Reativação)
registry.registerPath({
  method: "put",
  path: "/api/unidades/atualizar-vinculo",
  tags: ["Unidades"],
  summary: "Altera o status do vínculo (Soft Delete)",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: atualizarStatusVinculoSchema } },
    },
  },
  responses: { 200: { description: "Status atualizado" } },
});

// --- 2. DEFINIÇÃO DAS ROTAS (EXPRESS) ---

// Listar unidades (Dashboard)
router.get("/", verificarToken, (req, res) => controller.index(req, res));

// Operações em massa
router.post("/gerar-unidades", verificarToken, (req, res) =>
  controller.storeMassa(req, res),
);

// Vínculos e Moradores
router.post("/vincular-morador", verificarToken, (req, res) =>
  controller.vincular(req, res),
);

// 🔥 ROTA ADICIONADA: Vínculo por Texto
router.post("/vincular-morador-bloco", verificarToken, (req, res) =>
  controller.vincularPorTexto(req, res),
);

router.get("/moradores-vinculados", verificarToken, (req, res) =>
  controller.listarMoradores(req, res),
);

router.put("/atualizar-vinculo", verificarToken, (req, res) =>
  controller.updateStatus(req, res),
);

export default router;
