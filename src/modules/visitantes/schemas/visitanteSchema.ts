import { z } from "zod";
import { registry } from "@shared/infra/http/openapi/registry";

// =================================================================
// 1. GESTÃO DO VISITANTE (PERFIL/CRM)
// =================================================================

export const cadastrarVisitanteSchema = z.object({
  nome_completo: z.string().min(3, "Nome muito curto"),
  cpf: z.string().transform(v => v.replace(/\D/g, "")).pipe(z.string().length(11, "CPF inválido")),
  rg: z.string().optional().nullable(),
  empresa: z.string().optional().nullable(),
  foto_base64: z.string().optional().nullable(),
  tipo: z.enum(["visitante", "prestador", "corretor"]).default("visitante"),
});

export const atualizarVisitanteSchema = z.object({
  nome_completo: z.string().min(3, "Nome muito curto").optional(),
  rg: z.string().optional().nullable(),
  empresa: z.string().optional().nullable(),
  foto_base64: z.string().optional().nullable(),
  tipo: z.enum(["visitante", "prestador", "corretor"]).optional(),
});

/** Filtros para a base mestra de visitantes */
export const filtrarVisitantesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  tem_restricao: z.preprocess((val) => val === "true", z.boolean()).optional(),
});

// =================================================================
// 2. GESTÃO DE ACESSOS (MOVIMENTAÇÃO)
// =================================================================

export const registrarEntradaSchema = z.object({
  nome_completo: z.string().min(3),
  cpf: z.string().transform(v => v.replace(/\D/g, "")).pipe(z.string().length(11)),
  rg: z.string().optional().nullable(),
  foto_base64: z.string().optional().nullable(),
  tipo: z.enum(["visitante", "prestador", "corretor"]),
  unidade_id: z.string().uuid().optional().nullable(),
  autorizado_por_id: z.string().uuid().optional().nullable(),
  placa_veiculo: z.string().optional().nullable(),
  empresa_prestadora: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

export const registrarSaidaSchema = z.object({
  id: z.string().uuid("ID da visita inválido"),
});

export const filtrarAcessosSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  bloco: z.string().optional(),
  unidade: z.string().optional(),
  cpf: z.string().optional(),
  status: z.enum(["aberta", "finalizada", "cancelada"]).optional(),
});

// =================================================================
// 3. SEGURANÇA (RESTRIÇÕES 1:N)
// =================================================================

/** ✅ NOVO: Schema para Registrar Nova Restrição */
export const registrarRestricaoSchema = z.object({
  dados: z.object({
    tipo_restricao: z.enum(["judicial", "administrativa", "conflito"]),
    descricao: z.string().min(5, "O motivo deve ser detalhado"),
    instrucao_portaria: z.string().min(5, "A instrução deve ser clara"),
  })
});

/** ✅ NOVO: Schema para Atualizar Restrição Existente */
export const atualizarRestricaoSchema = z.object({
  dados: z.object({
    tipo_restricao: z.enum(["judicial", "administrativa", "conflito"]).optional(),
    descricao: z.string().min(5).optional(),
    instrucao_portaria: z.string().min(5).optional(),
  })
});

export const idParamSchema = z.object({
  id: z.string().uuid("ID inválido"),
});

export const buscarCpfParamsSchema = z.object({
  cpf: z.string().transform(v => v.replace(/\D/g, "")).pipe(z.string().length(11, "CPF deve ter 11 dígitos"))
});

// =================================================================
// REGISTRO OPENAPI (DOCUMENTAÇÃO COMPLETA)
// =================================================================

// Perfis e CRM
registry.register("CadastrarVisitante", cadastrarVisitanteSchema);
registry.register("AtualizarVisitante", atualizarVisitanteSchema);
registry.register("FiltrarVisitantes", filtrarVisitantesSchema);

// Acessos e Movimentação
registry.register("RegistrarEntrada", registrarEntradaSchema);
registry.register("RegistrarSaida", registrarSaidaSchema);
registry.register("FiltrarAcessos", filtrarAcessosSchema);

// Segurança
registry.register("RegistrarRestricao", registrarRestricaoSchema);
registry.register("AtualizarRestricao", atualizarRestricaoSchema);
registry.register("IdParam", idParamSchema);
registry.register("BuscarCpfParams", buscarCpfParamsSchema);