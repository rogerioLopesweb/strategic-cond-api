import { z } from "zod";
import { registry } from "@shared/infra/http/openapi/registry";

/**
 * Helper para transformar strings vazias vindas de Query Params em undefined.
 * Evita que o banco tente filtrar por uma string "" (vazia).
 */
const emptyToUndefined = z.preprocess(
  (val) => (val === "" ? undefined : val),
  z.string().optional(),
);

/**
 * 🆔 Validação de UUID para parâmetros de rota (:id)
 */
export const idParamSchema = z.object({
  id: z
    .string()
    .uuid({ message: "O ID fornecido deve ser um UUID válido." })
    .openapi({
      description: "ID do condomínio ou da conta",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
});

/**
 * ✨ Schema para Criação de Condomínio
 */
export const createCondominioSchema = registry.register(
  "CreateCondominioInput",
  z.object({
    nome_fantasia: z
      .string()
      .min(3, "Nome fantasia deve ter no mínimo 3 caracteres")
      .openapi({ example: "Condomínio Residencial Horizonte" }),
    razao_social: z
      .string()
      .optional()
      .openapi({ example: "Horizonte Empreendimentos LTDA" }),
    cnpj: z.string().optional().openapi({ example: "12.345.678/0001-99" }),
    logradouro: z
      .string()
      .optional()
      .openapi({ example: "Avenida das Palmeiras" }),
    numero: z.string().optional().openapi({ example: "1500" }),
    bairro: z.string().optional().openapi({ example: "Jardim América" }),
    cidade: z.string().optional().openapi({ example: "São Paulo" }),
    estado: z
      .string()
      .length(2, "Use a sigla do estado (ex: SP)")
      .optional()
      .openapi({ example: "SP" }),
    cep: z.string().optional().openapi({ example: "01001000" }),
    perfil: z.string().default("sindico").openapi({
      description: "Perfil do criador no condomínio",
      example: "sindico",
    }),
    conta_id: z.string().uuid().optional().openapi({
      description:
        "Obrigatório se um Master estiver criando para uma conta específica",
    }),
  }),
);

/**
 * 📝 Schema para Atualização
 */
export const updateCondominioSchema = registry.register(
  "UpdateCondominioInput",
  z.object({
    nome_fantasia: z.string().min(3).optional(),
    razao_social: z.string().optional(),
    cnpj: z.string().optional(),
    logradouro: z.string().optional(),
    numero: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().length(2).optional(),
    cep: z.string().optional(),
    ativo: z.boolean().optional(),
  }),
);

/**
 * 🔍 Schema para Filtros de Listagem e Paginação
 */
export const listCondominioSchema = z.object({
  cidade: emptyToUndefined,
  estado: emptyToUndefined,
  nome_fantasia: emptyToUndefined,
  cnpj: emptyToUndefined,

  // Coerção automática de String (Query) para Number
  page: z
    .preprocess((val) => (val ? Number(val) : 1), z.number().min(1).default(1))
    .openapi({ type: "integer", example: 1 }),

  limit: z
    .preprocess(
      (val) => (val ? Number(val) : 10),
      z.number().min(1).max(100).default(10),
    )
    .openapi({ type: "integer", example: 10 }),
});

// Tipos inferidos para uso nos DTOs e UseCases
export type CreateCondominioInput = z.infer<typeof createCondominioSchema>;
export type UpdateCondominioInput = z.infer<typeof updateCondominioSchema>;
export type ListCondominioFiltersInput = z.infer<typeof listCondominioSchema>;
