import { Router } from "express";
import { verificarToken } from "@shared/infra/http/middlewares/authMiddleware";
import { registry } from "@shared/infra/http/openapi/registry";
import { makeUsuarioController } from "../factories/UsuarioFactory";

import {
  listUsuarioSchema,
  createUsuarioSchema,
  getUsuarioDetalhadoSchema,
  updateUsuarioSchema,
  updatePerfilSchema,
  updateFotoSchema,
  updateStatusSchema,
  pushTokenSchema,
} from "../schemas/usuarioSchema";

const router = Router();
const controller = makeUsuarioController();

// --- OPENAPI REGISTRY (Mantendo exatamente como era) ---

registry.registerPath({
  method: "get",
  path: "/api/usuarios/condominio",
  tags: ["Usuários"],
  security: [{ bearerAuth: [] }],
  request: { query: listUsuarioSchema },
  responses: { 200: { description: "Lista de usuários recuperada" } },
});
router.get("/condominio", verificarToken, (req, res) =>
  controller.listar(req, res),
);

registry.registerPath({
  method: "post",
  path: "/api/usuarios/cadastrar",
  tags: ["Usuários"],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: createUsuarioSchema } } },
  },
  responses: { 200: { description: "Usuário cadastrado" } },
});
router.post("/cadastrar", verificarToken, (req, res) =>
  controller.cadastrar(req, res),
);

registry.registerPath({
  method: "get",
  path: "/api/usuarios/detalhes",
  tags: ["Usuários"],
  security: [{ bearerAuth: [] }],
  request: { query: getUsuarioDetalhadoSchema },
  responses: { 200: { description: "Detalhes recuperados" } },
});
// Nota: Ajustamos o controller para ler de query ou params conforme o schema
router.get("/detalhes", verificarToken, (req, res) =>
  controller.exibir(req, res),
);

registry.registerPath({
  method: "put",
  path: "/api/usuarios",
  tags: ["Usuários"],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: updateUsuarioSchema } } },
  },
  responses: { 200: { description: "Atualizado com sucesso" } },
});
router.put("/", verificarToken, (req, res) => controller.atualizar(req, res));

registry.registerPath({
  method: "put",
  path: "/api/usuarios/perfil",
  tags: ["Usuários"],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: updatePerfilSchema } } },
  },
  responses: { 200: { description: "Perfil atualizado" } },
});
router.put("/perfil", verificarToken, (req, res) =>
  controller.atualizar(req, res),
);

registry.registerPath({
  method: "put",
  path: "/api/usuarios/foto",
  tags: ["Usuários"],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: updateFotoSchema } } },
  },
  responses: { 200: { description: "Foto atualizada" } },
});
// Criamos um método específico ou usamos o atualizar que já trata foto
router.put("/foto", verificarToken, (req, res) =>
  controller.atualizar(req, res),
);

registry.registerPath({
  method: "post",
  path: "/api/usuarios/atualiza_status",
  tags: ["Usuários"],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: updateStatusSchema } } },
  },
  responses: { 200: { description: "Status atualizado" } },
});
router.post("/atualiza_status", verificarToken, (req, res) =>
  controller.atualizarStatus(req, res),
);

registry.registerPath({
  method: "post",
  path: "/api/usuarios/push-token",
  tags: ["Usuários"],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: pushTokenSchema } } },
  },
  responses: { 200: { description: "Token salvo" } },
});
router.post("/push-token", verificarToken, (req, res) =>
  controller.atualizarToken(req, res),
);

export default router;
