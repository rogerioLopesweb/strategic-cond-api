import { Router } from "express";
import {
  atualizarEntrega,
  cadastrarEntrega,
  cancelarEntrega,
  listarEntregas,
  registrarRetirada,
  registrarSaidaManual,
  registrarSaidaQRCode,
} from "../controllers/entregaController";
import { verificarToken } from "../middlewares/authMiddleware";
import { registry } from "../config/openApiRegistry";
import {
  createEntregaSchema,
  listEntregaSchema,
  registrarRetiradaSchema,
} from "../schemas/entregaSchema";
import { z } from "zod";

const router = Router();

registry.registerPath({
  method: "post",
  path: "/api/entregas",
  tags: ["Entregas"],
  summary: "Registra uma nova entrega",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createEntregaSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Entrega registrada com sucesso",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            entrega_id: z.string().uuid(),
            foto_url: z.string().nullable(),
          }),
        },
      },
    },
  },
});
router.post("/", verificarToken, cadastrarEntrega);

registry.registerPath({
  method: "get",
  path: "/api/entregas",
  tags: ["Entregas"],
  summary: "Lista entregas com filtros",
  security: [{ bearerAuth: [] }],
  request: {
    query: listEntregaSchema,
  },
  responses: {
    200: {
      description: "Lista de entregas com paginação",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            meta: z.object({
              total: z.number(),
              pagina: z.number(),
              limite: z.number(),
            }),
            data: z.array(z.any()),
          }),
        },
      },
    },
  },
});
router.get("/", verificarToken, listarEntregas);

registry.registerPath({
  method: "put",
  path: "/api/entregas/retirada",
  tags: ["Entregas"],
  summary: "Registra a retirada de uma entrega",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: registrarRetiradaSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Entrega marcada como retirada",
    },
  },
});
router.put("/retirada", verificarToken, registrarRetirada);

registry.registerPath({
  method: "patch",
  path: "/api/entregas/{id}/saida-manual",
  tags: ["Entregas"],
  summary: "Registra a saída manual de uma entrega (Portaria)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            quem_retirou: z.string(),
            documento_retirou: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Saída registrada com sucesso",
    },
  },
});
router.patch("/:id/saida-manual", verificarToken, registrarSaidaManual);

registry.registerPath({
  method: "patch",
  path: "/api/entregas/{id}/saida-qrcode",
  tags: ["Entregas"],
  summary: "Registra saída via QR Code",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Retirada confirmada",
    },
    400: {
      description: "QR Code inválido ou já utilizado",
    },
  },
});
router.patch("/:id/saida-qrcode", verificarToken, registrarSaidaQRCode);

registry.registerPath({
  method: "put",
  path: "/api/entregas/{id}",
  tags: ["Entregas"],
  summary: "Atualiza os dados de uma entrega existente",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            condominio_id: z.string().uuid(),
            marketplace: z.string().optional(),
            observacoes: z.string().optional(),
            retirada_urgente: z.boolean().optional(),
            tipo_embalagem: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Cadastro atualizado",
    },
  },
});
router.put("/:id", verificarToken, atualizarEntrega);

registry.registerPath({
  method: "patch",
  path: "/api/entregas/{id}/cancelar",
  tags: ["Entregas"],
  summary: "Cancela uma entrega (Auditoria)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
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
  responses: {
    200: {
      description: "Entrega cancelada",
    },
  },
});
router.patch("/:id/cancelar", verificarToken, cancelarEntrega);

export default router;
