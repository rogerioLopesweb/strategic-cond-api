import { z } from "zod";
import { registry } from "@shared/infra/http/openapi/registry";

export const registrarEntradaSchema = z.object({
  nome_completo: z.string().min(3, "Nome é obrigatório"),
  cpf: z.string().min(11, "CPF inválido"),
  rg: z.string().optional(),
  foto_url: z.string().url().optional(),
  tipo_padrao: z.enum(["visitante", "prestador", "corretor"]),
  unidade_id: z.string().uuid().optional(),
  autorizado_por_id: z.string().uuid().optional(),
  placa_veiculo: z.string().optional(),
  observacoes: z.string().optional(),
});

export const registrarSaidaSchema = z.object({
  id: z.string().uuid("ID da visita inválido"),
});

export const listVisitantesSchema = z.object({
  // Paginação com coerção de string para number (vinda da Query)
  page: z
    .preprocess((val) => (val ? Number(val) : 1), z.number().min(1).default(1))
    .openapi({ type: "integer", example: 1 }),

  limit: z
    .preprocess(
      (val) => (val ? Number(val) : 10),
      z.number().min(1).max(100).default(10),
    )
    .openapi({ type: "integer", example: 10 }),

  // Filtros de data opcionais
  dataInicio: z
    .preprocess(
      (val) => (val ? new Date(val as string) : undefined),
      z.date().optional(),
    )
    .openapi({ type: "string", format: "date-time" }),

  dataFim: z
    .preprocess(
      (val) => (val ? new Date(val as string) : undefined),
      z.date().optional(),
    )
    .openapi({ type: "string", format: "date-time" }),
});

export const buscarCpfParamsSchema = z.object({
  cpf: z.string().regex(/^\d{11}$/, "O CPF deve conter exatamente 11 números."),
});
