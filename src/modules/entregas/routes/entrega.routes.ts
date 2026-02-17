import { Router } from "express";
import { makeEntregaController } from "../factories/EntregaFactory";
import { verificarToken } from "@shared/infra/http/middlewares/authMiddleware";
import { registry } from "@shared/infra/http/openapi/registry";
import {
  createEntregaSchema,
  listEntregaSchema,
  registrarRetiradaSchema,
} from "../schemas/entregaSchema";
import { z } from "zod";

const router = Router();
const controller = makeEntregaController();

// --- 1. REGISTRO OPENAPI (SWAGGER) ---

registry.registerPath({
  method: "post",
  path: "/api/entregas",
  tags: ["Entregas"],
  summary: "Registra uma nova encomenda na portaria",
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: createEntregaSchema } } },
  },
  responses: {
    201: { description: "Entrega registrada e morador notificado" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/entregas",
  tags: ["Entregas"],
  summary: "Lista entregas com filtros e paginação",
  security: [{ bearerAuth: [] }],
  request: { query: listEntregaSchema },
  responses: { 200: { description: "Sucesso" } },
});

registry.registerPath({
  method: "put",
  path: "/api/entregas/retirada",
  tags: ["Entregas"],
  summary: "Registra a retirada manual de uma encomenda",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: registrarRetiradaSchema } },
    },
  },
  responses: { 200: { description: "Retirada confirmada" } },
});

registry.registerPath({
  method: "patch",
  path: "/api/entregas/{id}/saida-qrcode",
  tags: ["Entregas"],
  summary: "Confirma retirada via QR Code",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: { 200: { description: "QR Code validado com sucesso" } },
});

registry.registerPath({
  method: "patch",
  path: "/api/entregas/{id}/cancelar",
  tags: ["Entregas"],
  summary: "Cancela um registro de entrega (Auditoria)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            motivo_cancelamento: z.string(),
            condominio_id: z.string().uuid(),
          }),
        },
      },
    },
  },
  responses: { 200: { description: "Cancelamento registrado" } },
});

// --- 2. DEFINIÇÃO DAS ROTAS ---

// Cadastro e Listagem
router.post("/", verificarToken, (req, res) => controller.store(req, res));
router.get("/", verificarToken, (req, res) => controller.index(req, res));

// Fluxos de Saída (Baixa)
router.put("/retirada", verificarToken, (req, res) =>
  controller.registrarRetirada(req, res),
);
router.patch("/:id/saida-qrcode", verificarToken, (req, res) =>
  controller.saidaQRCode(req, res),
);

// Gestão e Correção
router.put("/:id", verificarToken, (req, res) => controller.update(req, res));
router.patch("/:id/cancelar", verificarToken, (req, res) =>
  controller.cancelar(req, res),
);

export default router;
