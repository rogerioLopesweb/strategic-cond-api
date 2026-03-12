import { z } from "zod";
import { registry } from "@shared/infra/http/openapi/registry";

// =================================================================
// 1. SCHEMAS DE ACESSO (MOVIMENTAÇÃO)
// =================================================================

export const registrarEntradaSchema = z.object({
  nome_completo: z.string().min(3, "O nome completo deve ter no mínimo 3 caracteres"),
  cpf: z.string().transform(v => v.replace(/\D/g, "")).pipe(z.string().length(11, "O CPF deve ter 11 dígitos")),
  rg: z.string().optional().nullable(),
  foto_base64: z.string().optional().nullable(),
  tipo_padrao: z.enum(["visitante", "prestador", "corretor"]),
  empresa: z.string().optional().nullable(),
  condominio_id: z.string().uuid("ID do condomínio inválido"),
  unidade_id: z.string().uuid().optional().nullable(),
  autorizado_por_id: z.string().uuid().optional().nullable(),
  placa_veiculo: z.string().optional().nullable(),
  empresa_prestadora: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

export const registrarSaidaSchema = z.object({
  id: z.string().uuid("ID da visita inválido"),
});

// =================================================================
// 2. SCHEMAS DE GESTÃO DE PESSOAS (CRM)
// =================================================================

/** ✅ NOVO: Schema para o cadastro fixo de visitante/pessoa */
export const cadastrarPessoaSchema = z.object({
  nome_completo: z.string().min(3, "Nome muito curto"),
  cpf: z.string().transform(v => v.replace(/\D/g, "")).pipe(z.string().length(11, "CPF inválido")),
  rg: z.string().optional().nullable(),
  empresa: z.string().optional().nullable(),
  foto_url: z.string().optional().nullable(), // Pode vir do upload ou string
  tipo_padrao: z.enum(["visitante", "prestador", "corretor"]).default("visitante"),
});

/** ✅ NOVO: Listagem de Pessoas (Cadastros Únicos) */
export const listPessoasSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(), // Busca por nome ou CPF
});

/** ✅ NOVO: Parâmetros para Detalhes e Ações por ID */
export const visitanteIdParamSchema = z.object({
  id: z.string().uuid("ID do visitante inválido"),
});

// =================================================================
// 3. SCHEMAS DE SEGURANÇA (RESTRIÇÕES)
// =================================================================

/** ✅ NOVO: Gerenciamento de Bloqueios no Modal */
export const gerenciarRestricaoSchema = z.object({
  acao: z.enum(["registrar", "remover"]),
  tipo_restricao: z.enum(["judicial", "administrativa", "conflito"]).optional(),
  descricao: z.string().min(5, "A descrição deve ser detalhada").optional(),
  instrucao_portaria: z.string().min(5, "Instrução para o porteiro é obrigatória").optional(),
});

// =================================================================
// 4. SCHEMAS DE CONSULTA E FILTROS
// =================================================================

export const listVisitantesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  condominio_id: z.string().uuid().optional(),
  bloco: z.string().optional(),
  unidade: z.string().optional(),
  cpf: z.string().optional(),
  status: z.enum(["aberta", "finalizada", "cancelada"]).optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
});

export const buscarCpfParamsSchema = z.object({
  cpf: z.string().transform(v => v.replace(/\D/g, ""))
});

// =================================================================
// REGISTRO OPENAPI
// =================================================================

registry.register("RegistrarEntrada", registrarEntradaSchema);
registry.register("RegistrarSaida", registrarSaidaSchema);
registry.register("CadastrarPessoa", cadastrarPessoaSchema);
registry.register("GerenciarRestricao", gerenciarRestricaoSchema);
registry.register("ListarVisitas", listVisitantesSchema);
registry.register("ListarPessoas", listPessoasSchema);