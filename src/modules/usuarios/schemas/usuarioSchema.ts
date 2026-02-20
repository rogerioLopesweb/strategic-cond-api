import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { registry } from "@shared/infra/http/openapi/registry";

extendZodWithOpenApi(z);
/**
 * Schema isolado para validar o ID do condomínio no contexto das rotas.
 * Usado pelo authMiddleware para garantir que o ID é um UUID válido.
 */
export const contextCondominioSchema = z.string().trim().uuid().openapi({
  example: "123e4567-e89b-12d3-a456-426614174000",
  description: "ID do condomínio para validação de contexto e permissão",
});
/**
 * Sub-schema para Unidades
 */
const unidadeSchema = z.object({
  identificador_bloco: z.string(),
  numero: z.string(),
  tipo_vinculo: z.string().openapi({ example: "proprietario" }),
});

/**
 * Schema para listagem de usuários
 */
export const listUsuarioSchema = z.object({
  condominio_id: z
    .string()
    .trim()
    .uuid()
    .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
  nome: z.string().optional().openapi({ example: "João" }),
  perfil: z.string().optional().openapi({ example: "morador" }),
  bloco: z.string().optional().openapi({ example: "A" }),
  unidade: z.string().optional().openapi({ example: "101" }),
  page: z.coerce.number().min(1).default(1).openapi({ example: 1 }),
  limit: z.coerce.number().min(1).max(100).default(10).openapi({ example: 10 }),
});

/**
 * Schema para cadastro completo
 */
export const createUsuarioSchema = registry.register(
  "CreateUsuarioInput",
  z.object({
    nome_completo: z
      .string()
      .min(3, "Nome completo é obrigatório")
      .openapi({ example: "João da Silva" }),
    cpf: z
      .string()
      .regex(/^\d{11}$/, "CPF deve conter 11 dígitos numéricos")
      .openapi({ example: "12345678901" }),
    email: z
      .string()
      .email("Email inválido")
      .openapi({ example: "joao@email.com" }),
    telefone: z.string().optional().openapi({ example: "11999999999" }),
    perfil: z.string().default("morador").openapi({ example: "morador" }),
    condominio_id: z
      .string()
      .trim()
      .uuid()
      .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
    unidades: z.array(unidadeSchema).optional(),
    /* foto_base64: z
      .string()
      .optional()
      .openapi({ description: "Foto de perfil em Base64" }),
    data_nascimento: z
      .string()
      .optional()
      .openapi({ example: "01/01/1980", description: "DD/MM/YYYY" }),
    contato_emergencia: z
      .string()
      .optional()
      .openapi({ example: "Maria (11) 98888-8888" }),*/
  }),
);

/**
 * Schema para atualização completa
 */
export const updateUsuarioSchema = registry.register(
  "UpdateUsuarioInput",
  z.object({
    usuario_id: z
      .string()
      .trim()
      .uuid()
      .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
    nome_completo: z
      .string()
      .min(3)
      .optional()
      .openapi({ example: "João da Silva" }),
    email: z.string().email().optional().openapi({ example: "joao@email.com" }),
    telefone: z.string().optional().openapi({ example: "11999999999" }),
    perfil: z.string().optional().openapi({ example: "sindico" }),
    condominio_id: z
      .string()
      .trim()
      .uuid()
      .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
    unidades: z.array(unidadeSchema).optional(),
    foto_base64: z
      .string()
      .optional()
      .openapi({ description: "Foto de perfil em Base64" }),
    data_nascimento: z.string().optional().openapi({ example: "01/01/1980" }),
    contato_emergencia: z
      .string()
      .optional()
      .openapi({ example: "Maria (11) 98888-8888" }),
  }),
);

/**
 * Schema para atualização de perfil (dados básicos)
 */
export const updatePerfilSchema = registry.register(
  "UpdatePerfilInput",
  updateUsuarioSchema.omit({
    unidades: true,
    foto_base64: true,
  }),
);

/**
 * Schema para atualização de foto
 */
export const updateFotoSchema = registry.register(
  "UpdateFotoInput",
  z.object({
    usuario_id: z
      .string()
      .trim()
      .uuid()
      .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
    condominio_id: z
      .string()
      .trim()
      .uuid()
      .optional()
      .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
    foto_base64: z
      .string()
      .min(1, "Foto é obrigatória")
      .openapi({ description: "Base64 da nova foto" }),
  }),
);

/**
 * Schema para atualização de status
 */
export const updateStatusSchema = registry.register(
  "UpdateStatusInput",
  z.object({
    usuario_id: z
      .string()
      .trim()
      .uuid()
      .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
    condominio_id: z
      .string()
      .trim()
      .uuid()
      .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
    ativo: z.boolean().openapi({ example: true }),
  }),
);

export const pushTokenSchema = registry.register(
  "PushTokenInput",
  z.object({
    token: z
      .string()
      .min(1)
      .openapi({ example: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" }),
  }),
);

export const getUsuarioDetalhadoSchema = z.object({
  id: z
    .string()
    .trim()
    .uuid()
    .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
  condominio_id: z
    .string()
    .trim()
    .uuid()
    .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
});

export type CreateUsuarioDTO = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioDTO = z.infer<typeof updateUsuarioSchema>;
export type ListUsuarioFilters = z.infer<typeof listUsuarioSchema>;
