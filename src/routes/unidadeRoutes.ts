import { Router } from "express";
import {
  listarUnidades,
  gerarUnidadesEmMassa,
  vincularMoradorUnidade,
  buscarMoradoresPorUnidade,
  vincularMoradorPorBloco,
  atualizarStatusVinculo,
} from "../controllers/unidadeController";
import { verificarToken } from "../middlewares/authMiddleware";
import { registry } from "../config/openApiRegistry";
import {
  listUnidadeSchema,
  gerarUnidadesSchema,
  vincularMoradorSchema,
  vincularMoradorPorTextoSchema,
  atualizarStatusVinculoSchema,
  buscarMoradoresSchema,
} from "../schemas/unidadeSchema";
import { z } from "zod";

const router = Router();

registry.registerPath({
  method: "get",
  path: "/api/unidades",
  tags: ["Unidades"],
  summary: "Lista unidades com filtros e paginação",
  security: [{ bearerAuth: [] }],
  request: {
    query: listUnidadeSchema,
  },
  responses: {
    200: {
      description: "Lista de unidades recuperada",
    },
  },
});
router.get("/", verificarToken, listarUnidades);

registry.registerPath({
  method: "post",
  path: "/api/unidades/gerar-unidades",
  tags: ["Unidades"],
  summary: "Gera unidades em massa",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: gerarUnidadesSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Unidades geradas com sucesso",
    },
  },
});
router.post("/gerar-unidades", verificarToken, gerarUnidadesEmMassa);

registry.registerPath({
  method: "post",
  path: "/api/unidades/vincular-morador",
  tags: ["Unidades"],
  summary: "Vincula morador via ID da Unidade",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: vincularMoradorSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Morador vinculado com sucesso",
    },
  },
});
router.post("/vincular-morador", verificarToken, vincularMoradorUnidade);

registry.registerPath({
  method: "post",
  path: "/api/unidades/vincular-morador-bloco",
  tags: ["Unidades"],
  summary: "Vincula morador buscando por Bloco e Número",
  description:
    "Usado na tela de edição para vincular imóveis sem precisar do ID prévio da unidade.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: vincularMoradorPorTextoSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Vínculo patrimonial criado",
    },
  },
});
router.post("/vincular-morador-bloco", verificarToken, vincularMoradorPorBloco);

registry.registerPath({
  method: "put",
  path: "/api/unidades/atualizar-vinculo",
  tags: ["Unidades"],
  summary: "Ativa ou encerra um vínculo (Soft Delete)",
  description:
    "Altera o status do vínculo. Se status for false, registra a data_saida.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: atualizarStatusVinculoSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Status do vínculo atualizado",
    },
  },
});
router.put("/atualizar-vinculo", verificarToken, atualizarStatusVinculo);

registry.registerPath({
  method: "get",
  path: "/api/unidades/moradores-vinculados",
  tags: ["Unidades"],
  summary: "Lista moradores ativos de uma unidade específica",
  security: [{ bearerAuth: [] }],
  request: {
    query: buscarMoradoresSchema,
  },
  responses: {
    200: {
      description: "Lista de moradores vinculados",
    },
  },
});
router.get("/moradores-vinculados", verificarToken, buscarMoradoresPorUnidade);

export default router;
