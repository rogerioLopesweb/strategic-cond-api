import { Router } from "express";
import { verificarToken } from "@shared/infra/http/middlewares/authMiddleware";
import { registry } from "@shared/infra/http/openapi/registry";
import { VisitantesController } from "@modules/visitantes/controllers/VisitantesController";

import {
  registrarEntradaSchema,
  registrarSaidaSchema,
  listVisitantesSchema,
  buscarCpfParamsSchema,
} from "@modules/visitantes/schemas/visitanteSchema";

const router = Router();
const controller = new VisitantesController();

// --- OPENAPI REGISTRY ---

// 1. ROTA DE ENTRADA (POST)
registry.registerPath({
  method: "post",
  path: "/api/visitantes/entrada",
  tags: ["Visitantes"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: registrarEntradaSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Entrada registrada com sucesso",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              id: { type: "string" }, // Retorna o ID da visita criada
            },
          },
        },
      },
    },
    400: { description: "Erro de validação ou CPF inválido" },
  },
});

router.post("/entrada", verificarToken, (req, res) =>
  controller.entrada(req, res),
);

// 2. ROTA DE SAÍDA (PATCH)
registry.registerPath({
  method: "patch", // Usamos PATCH pois alteramos apenas status/data_saida
  path: "/api/visitantes/saida/{id}",
  tags: ["Visitantes"],
  security: [{ bearerAuth: [] }],
  request: {
    params: registrarSaidaSchema, // Valida que o ID na URL é um UUID
  },
  responses: {
    200: { description: "Saída registrada com sucesso" },
    404: { description: "Visita não encontrada ou já finalizada" },
  },
});

router.patch("/saida/:id", verificarToken, (req, res) =>
  controller.saida(req, res),
);

// 3. ROTA DE LISTAGEM ÚNICA (GET) - Substitui Abertas e Histórico
registry.registerPath({
  method: "get",
  path: "/api/visitantes",
  tags: ["Visitantes"],
  security: [{ bearerAuth: [] }],
  request: {
    query: listVisitantesSchema,
  },
  responses: {
    200: {
      description: "Lista de visitas paginada e filtrada",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    visita_id: { type: "string" },
                    data_entrada: { type: "string", format: "date-time" },
                    data_saida: {
                      type: "string",
                      format: "date-time",
                      nullable: true,
                    },
                    status: { type: "string" },
                    placa_veiculo: { type: "string", nullable: true },
                    nome_visitante: { type: "string" },
                    cpf_visitante: { type: "string" },
                    foto_url: { type: "string", nullable: true },
                    tipo: { type: "string" },
                    bloco: { type: "string", nullable: true },
                    unidade: { type: "string", nullable: true },
                  },
                },
              },
              pagination: {
                type: "object",
                properties: {
                  total: { type: "integer" },
                  page: { type: "integer" },
                  limit: { type: "integer" },
                  total_pages: { type: "integer" },
                },
              },
            },
          },
        },
      },
    },
  },
});
router.get("/", verificarToken, (req, res) => controller.listar(req, res));

// 4. ROTA DE BUSCA POR CPF (GET) - Para auto-preenchimento
registry.registerPath({
  method: "get",
  path: "/api/visitantes/cpf/{cpf}", // ⚠️ Atenção: OpenAPI usa chaves {} para params
  tags: ["Visitantes"],
  security: [{ bearerAuth: [] }],
  request: {
    params: buscarCpfParamsSchema,
  },
  responses: {
    200: {
      description: "Visitante encontrado com sucesso",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              nome_completo: { type: "string" },
              cpf: { type: "string" },
              rg: { type: "string", nullable: true },
              foto_url: { type: "string", nullable: true },
              tipo_padrao: {
                type: "string",
                enum: ["visitante", "prestador", "corretor"],
              },
            },
          },
        },
      },
    },
    404: {
      description: "Visitante não encontrado (Primeira vez no condomínio)",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: { type: "string", example: "Visitante não encontrado." },
            },
          },
        },
      },
    },
    400: {
      description: "CPF inválido",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: { type: "string", example: "CPF inválido." },
            },
          },
        },
      },
    },
  },
});
router.get("/cpf/:cpf", verificarToken, (req, res) =>
  controller.buscarPorCpf(req, res),
);

export default router;
