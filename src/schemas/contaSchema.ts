import { z } from "zod";
import { registry } from "../config/openApiRegistry";

/**
 * Schema para validação de ID nos parâmetros
 */
export const contaIdParamSchema = z.object({
  id: z
    .string()
    .uuid({ message: "ID da conta inválido." })
    .openapi({
      description: "ID da conta",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
});

/**
 * Schema para criação de conta (Casca PJ)
 */
export const createContaSchema = registry.register(
  "CreateContaInput",
  z.object({
    razao_social: z
      .string()
      .min(1, "Razão social é obrigatória")
      .openapi({
        example: "Minha Administradora LTDA",
        description: "Razão Social ou Nome da Empresa",
      }),
    email_financeiro: z
      .string()
      .email("Email inválido")
      .optional()
      .or(z.literal(""))
      .openapi({
        example: "financeiro@empresa.com",
        description: "Email para faturamento",
      }),
  }),
);

/**
 * Schema para atualização de dados fiscais
 */
export const updateContaSchema = registry.register(
  "UpdateContaInput",
  z.object({
    cnpj: z
      .string()
      .regex(/^\d{14}$/, "CNPJ deve conter 14 dígitos numéricos")
      .optional()
      .openapi({ example: "12345678000199" }),
    razao_social: z
      .string()
      .min(1)
      .optional()
      .openapi({ example: "Minha Administradora LTDA" }),
    email_financeiro: z
      .string()
      .email("Email inválido")
      .optional()
      .openapi({ example: "financeiro@empresa.com" }),
    status_conta: z
      .string()
      .optional()
      .openapi({
        example: "ativa",
        description:
          "Status da conta (ativa, suspensa, aguardando_configuracao)",
      }),
  }),
);

// Tipos inferidos
export type CreateContaDTO = z.infer<typeof createContaSchema>;
export type UpdateContaDTO = z.infer<typeof updateContaSchema>;
