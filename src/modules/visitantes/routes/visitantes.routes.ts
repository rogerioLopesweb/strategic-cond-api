import { Router } from "express";
import { verificarToken } from "@shared/infra/http/middlewares/authMiddleware";
import { registry } from "@shared/infra/http/openapi/registry";
import { VisitantesController } from "../controllers/VisitantesController";

import {
  cadastrarVisitanteSchema,
  atualizarVisitanteSchema,
  filtrarVisitantesSchema,
  registrarEntradaSchema,
  filtrarAcessosSchema,
  idParamSchema,
  registrarRestricaoSchema,
  atualizarRestricaoSchema,
  buscarCpfParamsSchema
} from "../schemas/visitanteSchema"

const router = Router();
const controller = new VisitantesController();

// =================================================================
// 1. PERFIL DO VISITANTE (CADASTRO / CRM)
// =================================================================

// [OpenAPI] GET / (Base Mestra)
registry.registerPath({
  method: "get",
  path: "/api/visitantes",
  tags: ["Visitantes - Perfil"],
  security: [{ bearerAuth: [] }],
  request: { query: filtrarVisitantesSchema },
  responses: { 200: { description: "Lista de visitantes cadastrados" } },
});
router.get("/", verificarToken, (req, res) => controller.listarVisitantes(req, res));

// [OpenAPI] POST / (Novo Cadastro)
registry.registerPath({
  method: "post",
  path: "/api/visitantes",
  tags: ["Visitantes - Perfil"],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: cadastrarVisitanteSchema } } } },
  responses: { 201: { description: "Visitante cadastrado com sucesso" } },
});
router.post("/", verificarToken, (req, res) => controller.cadastrar(req, res));

// [OpenAPI] PUT /:id (Edição de Perfil)
registry.registerPath({
  method: "put",
  path: "/api/visitantes/{id}",
  tags: ["Visitantes - Perfil"],
  security: [{ bearerAuth: [] }],
  request: { 
    params: idParamSchema,
    body: { content: { "application/json": { schema: atualizarVisitanteSchema } } } 
  },
  responses: { 200: { description: "Cadastro atualizado" } },
});
router.put("/:id", verificarToken, (req, res) => controller.atualizar(req, res));

// [OpenAPI] DELETE /:id (Soft Delete de Visitante)
registry.registerPath({
  method: "delete",
  path: "/api/visitantes/{id}",
  tags: ["Visitantes - Perfil"],
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema },
  responses: { 204: { description: "Visitante removido" } },
});
router.delete("/:id", verificarToken, (req, res) => controller.excluir(req, res));

// [OpenAPI] GET /:id/detalhes (Dossiê/Modal)
registry.registerPath({
  method: "get",
  path: "/api/visitantes/{id}/detalhes",
  tags: ["Visitantes - Perfil"],
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema },
  responses: { 200: { description: "Dados, acessos e restrições consolidados" } },
});
router.get("/:id/detalhes", verificarToken, (req, res) => controller.detalhes(req, res));

// =================================================================
// 2. ACESSOS E MOVIMENTAÇÃO (TIMELINE)
// =================================================================

// [OpenAPI] GET /acessos (Timeline)
registry.registerPath({
  method: "get",
  path: "/api/visitantes/acessos",
  tags: ["Visitantes - Acessos"],
  security: [{ bearerAuth: [] }],
  request: { query: filtrarAcessosSchema },
  responses: { 200: { description: "Histórico de entradas e saídas" } },
});
router.get("/acessos", verificarToken, (req, res) => controller.listarAcessos(req, res));

// [OpenAPI] POST /acessos/entrada (Check-in)
registry.registerPath({
  method: "post",
  path: "/api/visitantes/acessos/entrada",
  tags: ["Visitantes - Acessos"],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: registrarEntradaSchema } } } },
  responses: { 201: { description: "Entrada registrada" } },
});
router.post("/acessos/entrada", verificarToken, (req, res) => controller.entrada(req, res));

// [OpenAPI] PATCH /acessos/:id/saida (Check-out)
registry.registerPath({
  method: "patch",
  path: "/api/visitantes/acessos/{id}/saida",
  tags: ["Visitantes - Acessos"],
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema },
  responses: { 200: { description: "Saída registrada" } },
});
router.patch("/acessos/:id/saida", verificarToken, (req, res) => controller.saida(req, res));

// =================================================================
// 3. SEGURANÇA (GESTÃO DE RESTRIÇÕES)
// =================================================================

// [OpenAPI] GET /buscar/:cpf (Consulta CRM no Check-in)
registry.registerPath({
  method: "get",
  path: "/api/visitantes/buscar/{cpf}",
  tags: ["Visitantes - Segurança"],
  security: [{ bearerAuth: [] }],
  request: { params: buscarCpfParamsSchema },
  responses: { 200: { description: "Busca de visitante com status de segurança" } },
});
router.get("/buscar/:cpf", verificarToken, (req, res) => controller.buscarPorCpf(req, res));

/** 🛡️ REGISTRAR RESTRIÇÃO (Id = VisitanteId) */
registry.registerPath({
  method: "post",
  path: "/api/visitantes/{id}/restricao",
  tags: ["Visitantes - Segurança"],
  security: [{ bearerAuth: [] }],
  request: { 
    params: idParamSchema,
    body: { content: { "application/json": { schema: registrarRestricaoSchema } } }
  },
  responses: { 201: { description: "Bloqueio registrado" } },
});
router.post("/:id/restricao", verificarToken, (req, res) => controller.registrarRestricao(req, res));

/** ✍️ ATUALIZAR RESTRIÇÃO (Id = RestricaoId) */
registry.registerPath({
  method: "put",
  path: "/api/visitantes/restricoes/{id}",
  tags: ["Visitantes - Segurança"],
  security: [{ bearerAuth: [] }],
  request: { 
    params: idParamSchema,
    body: { content: { "application/json": { schema: atualizarRestricaoSchema } } }
  },
  responses: { 200: { description: "Registro atualizado" } },
});
router.put("/restricoes/:id", verificarToken, (req, res) => controller.atualizarRestricao(req, res));

/** 🔌 CANCELAR/DESATIVAR (Id = RestricaoId) */
registry.registerPath({
  method: "patch",
  path: "/api/visitantes/restricoes/{id}/cancelar",
  tags: ["Visitantes - Segurança"],
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema },
  responses: { 200: { description: "Bloqueio desativado" } },
});
router.patch("/restricoes/:id/cancelar", verificarToken, (req, res) => controller.cancelarRestricao(req, res));

/** 🗑️ EXCLUIR DEFINITIVAMENTE (Id = RestricaoId) */
registry.registerPath({
  method: "delete",
  path: "/api/visitantes/restricoes/{id}",
  tags: ["Visitantes - Segurança"],
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema },
  responses: { 204: { description: "Registro removido" } },
});
router.delete("/restricoes/:id", verificarToken, (req, res) => controller.excluirRestricao(req, res));

export default router;