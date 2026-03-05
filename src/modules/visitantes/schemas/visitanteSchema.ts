import { z } from "zod";
import { registry } from "@shared/infra/http/openapi/registry";

export const registrarEntradaSchema = z.object({
  // Dados do Visitante
  nome_completo: z.string().min(3, "O nome completo deve ter no mínimo 3 caracteres"),
  cpf: z.string().regex(/^\d{11}$/, "O CPF deve conter exatamente 11 números"),
  rg: z.string().optional().nullable(),
  
  // ✅ AJUSTE: O App envia Base64 agora, não uma URL. 
  // Removido .url() para não barrar a string da foto.
  foto_base64: z.string().optional().nullable(),
  
  tipo_padrao: z.enum(["visitante", "prestador", "corretor"]),
  empresa: z.string().optional().nullable(),

  // Dados da Visita
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

export const listVisitantesSchema = z.object({
  // ✅ MELHORIA: Usando z.coerce.number() para converter string da Query automaticamente
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),

  // ✅ Adicionados filtros que o Controller utiliza
  condominio_id: z.string().uuid().optional(),
  bloco: z.string().optional(),
  unidade: z.string().optional(),
  cpf: z.string().optional(),
  status: z.enum(["aberta", "finalizada", "cancelada"]).optional(),

  // Filtros de data
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
});

export const buscarCpfParamsSchema = z.object({
  // Garante que o CPF chegue limpo (apenas números) para a busca
  cpf: z.string().regex(/^\d{11}$/, "O CPF deve conter exatamente 11 números."),
});

// Registros para Documentação OpenAPI (Swagger) se estiver usando
registry.register("RegistrarEntrada", registrarEntradaSchema);