import { z } from "zod";
import { registry } from "../config/openApiRegistry";

/**
 * Schema para validação de UUID nos parâmetros de rota
 */
export const idParamSchema = z.object({
  id: z
    .string()
    .trim()
    .uuid({ message: "ID inválido. Deve ser um UUID." })
    .openapi({
      description: "ID do condomínio",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
});

/**
 * Schema para criação de condomínio
 */
export const createCondominioSchema = registry.register(
  "CreateCondominioInput",
  z.object({
    nome_fantasia: z
      .string()
      .min(3, "Nome fantasia deve ter no mínimo 3 caracteres")
      .openapi({
        example: "Condomínio Solar",
        description: "Nome fantasia do condomínio",
      }),
    razao_social: z
      .string()
      .optional()
      .openapi({ example: "Solar Empreendimentos LTDA" }),
    cnpj: z.string().optional().openapi({ example: "12345678000199" }),
    logradouro: z.string().optional().openapi({ example: "Rua das Flores" }),
    numero: z.string().optional().openapi({ example: "123" }),
    bairro: z.string().optional().openapi({ example: "Centro" }),
    cidade: z.string().optional().openapi({ example: "São Paulo" }),
    estado: z
      .string()
      .length(2, "Estado deve ser a sigla (ex: SP)")
      .optional()
      .openapi({ example: "SP" }),
    cep: z.string().optional().openapi({ example: "01001000" }),
    perfil: z.string().default("sindico").openapi({
      example: "sindico",
      description: "Perfil do usuário criador no condomínio",
    }),
    conta_id: z.string().uuid().trim().optional().openapi({
      description: "ID da conta (Obrigatório se for Master)",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
  }),
);

/**
 * Schema para atualização de condomínio
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
 * Schema para filtros de listagem
 */
const emptyToUndefined = z.preprocess(
  (val) => (val === "" ? undefined : val),
  z.string().optional(),
);

export const listCondominioSchema = z.object({
  cidade: emptyToUndefined.openapi({ example: "São Paulo" }),
  estado: emptyToUndefined.openapi({ example: "SP" }),
  nome_fantasia: emptyToUndefined,
  cnpj: emptyToUndefined,

  // 🛡️ Coerção segura para números
  page: z
    .preprocess(
      (val) => (val === undefined || val === "" ? 1 : Number(val)),
      z.number().min(1).default(1),
    )
    .openapi({ type: "integer", example: 1 }),

  limit: z
    .preprocess(
      (val) => (val === undefined || val === "" ? 10 : Number(val)),
      z.number().min(1).max(100).default(10),
    )
    .openapi({ type: "integer", example: 10 }),
});
// Tipos inferidos para uso no TypeScript
export type CreateCondominioDTO = z.infer<typeof createCondominioSchema>;
export type UpdateCondominioDTO = z.infer<typeof updateCondominioSchema>;
export type ListCondominioFilters = z.infer<typeof listCondominioSchema>;
