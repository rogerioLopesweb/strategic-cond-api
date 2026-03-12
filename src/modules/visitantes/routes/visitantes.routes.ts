import { Router } from "express";
import { verificarToken } from "@shared/infra/http/middlewares/authMiddleware";
import { registry } from "@shared/infra/http/openapi/registry";
import { VisitantesController } from "@modules/visitantes/controllers/VisitantesController";

import {
  registrarEntradaSchema,
  registrarSaidaSchema,
  listVisitantesSchema,
  buscarCpfParamsSchema,
  cadastrarPessoaSchema,
  listPessoasSchema,
  visitanteIdParamSchema,
  gerenciarRestricaoSchema
} from "@modules/visitantes/schemas/visitanteSchema";

const router = Router();
const controller = new VisitantesController();

// =================================================================
// 1. GESTÃO DE ACESSOS (TIMELINE)
// =================================================================

// [OpenAPI] POST /entrada
registry.registerPath({
  method: "post",
  path: "/api/visitantes/entrada",
  tags: ["Visitantes - Acessos"],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: registrarEntradaSchema } } } },
  responses: { 201: { description: "Entrada registrada" } },
});
router.post("/entrada", verificarToken, (req, res) => controller.entrada(req, res));

// [OpenAPI] PATCH /saida/{id}
registry.registerPath({
  method: "patch",
  path: "/api/visitantes/saida/{id}",
  tags: ["Visitantes - Acessos"],
  security: [{ bearerAuth: [] }],
  request: { params: registrarSaidaSchema },
  responses: { 200: { description: "Saída registrada" } },
});
router.patch("/saida/:id", verificarToken, (req, res) => controller.saida(req, res));

// [OpenAPI] GET / (Timeline Global)
registry.registerPath({
  method: "get",
  path: "/api/visitantes",
  tags: ["Visitantes - Acessos"],
  security: [{ bearerAuth: [] }],
  request: { query: listVisitantesSchema },
  responses: { 200: { description: "Lista de acessos" } },
});
router.get("/", verificarToken, (req, res) => controller.listar(req, res));

// =================================================================
// 2. GESTÃO DE PESSOAS (CRM)
// =================================================================

// [OpenAPI] GET /pessoas (Listagem de Cadastros)
registry.registerPath({
  method: "get",
  path: "/api/visitantes/pessoas",
  tags: ["Visitantes - CRM"],
  security: [{ bearerAuth: [] }],
  request: { query: listPessoasSchema },
  responses: { 200: { description: "Lista de pessoas cadastradas" } },
});
router.get("/pessoas", verificarToken, (req, res) => controller.listarPessoas(req, res));

// [OpenAPI] POST /pessoas (Cadastro Fixo - Recebe foto via Base64 no body)
registry.registerPath({
  method: "post",
  path: "/api/visitantes/pessoas",
  tags: ["Visitantes - CRM"],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: cadastrarPessoaSchema } } } },
  responses: { 201: { description: "Pessoa cadastrada com sucesso" } },
});
router.post("/pessoas", verificarToken, (req, res) => controller.cadastrarPessoa(req, res));

// [OpenAPI] GET /pessoas/{id}/detalhes (Para o Modal)
registry.registerPath({
  method: "get",
  path: "/api/visitantes/pessoas/{id}/detalhes",
  tags: ["Visitantes - CRM"],
  security: [{ bearerAuth: [] }],
  request: { params: visitanteIdParamSchema },
  responses: { 200: { description: "Ficha completa do visitante" } },
});
router.get("/pessoas/:id/detalhes", verificarToken, (req, res) => controller.detalhes(req, res));

// =================================================================
// 3. SEGURANÇA E CONSULTAS
// =================================================================

// [OpenAPI] GET /cpf/{cpf} (Busca rápida na Portaria)
registry.registerPath({
  method: "get",
  path: "/api/visitantes/cpf/{cpf}",
  tags: ["Visitantes - Segurança"],
  security: [{ bearerAuth: [] }],
  request: { params: buscarCpfParamsSchema },
  responses: { 200: { description: "Visitante e alertas de segurança" } },
});
router.get("/cpf/:cpf", verificarToken, (req, res) => controller.buscarPorCpf(req, res));

// [OpenAPI] POST /pessoas/{id}/restricao (Bloqueio)
registry.registerPath({
  method: "post",
  path: "/api/visitantes/pessoas/{id}/restricao",
  tags: ["Visitantes - Segurança"],
  security: [{ bearerAuth: [] }],
  request: { 
    params: visitanteIdParamSchema,
    body: { content: { "application/json": { schema: gerenciarRestricaoSchema } } }
  },
  responses: { 200: { description: "Restrição gerenciada" } },
});
router.post("/pessoas/:id/restricao", verificarToken, (req, res) => 
  controller.gerenciarRestricao(req, res)
);

export default router;