import { z } from "zod";
import { registry } from "@shared/infra/http/openapi/registry";

/**
 * Schema para cadastro de nova entrega
 */
export const createEntregaSchema = registry.register(
  "CreateEntregaInput",
  z.object({
    condominio_id: z
      .string()
      .trim()
      .uuid()
      .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
    bloco: z.string().min(1, "Bloco é obrigatório").openapi({ example: "A" }),
    unidade: z
      .string()
      .min(1, "Número da unidade é obrigatório")
      .openapi({ example: "101" }),
    observacoes: z.string().optional().openapi({
      example: "Pacote Amazon",
      description: "Observações sobre a entrega",
    }),
    codigo_rastreio: z
      .string()
      .optional()
      .openapi({ example: "AA123456789BR" }),
    marketplace: z.string().optional().openapi({ example: "Mercado Livre" }),
    morador_id: z
      .string()
      .trim()
      .uuid()
      .optional()
      .openapi({ description: "ID do morador destinatário" }),
    operador_entrada_id: z
      .string()
      .trim()
      .uuid()
      .optional()
      .openapi({ description: "ID do operador que recebeu" }),
    retirada_urgente: z
      .boolean()
      .optional()
      .default(false)
      .openapi({ example: false }),
    tipo_embalagem: z
      .string()
      .optional()
      .default("Pacote")
      .openapi({ example: "Caixa" }),
    foto_base64: z
      .string()
      .optional()
      .openapi({ description: "Base64 da imagem da encomenda" }),
    urlFoto: z
      .string()
      .optional()
      .openapi({ description: "URL da foto (caso enviada externamente)" }),
  }),
);

/**
 * Schema para registrar a retirada da entrega
 */
export const registrarRetiradaManualSchema = registry.register(
  "RegistrarRetiradaInput",
  z.object({
    entrega_id: z
      .string()
      .trim()
      .uuid()
      .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
    retirado_por: z
      .string()
      .min(3, "Nome de quem retirou é obrigatório")
      .openapi({ example: "Morador João" }),
    documento_retirada: z.string().optional().openapi({
      example: "12.345.678-9",
      description: "RG ou CPF de quem retirou",
    }),
    foto_retirada_base64: z.string().optional().openapi({
      description: "Base64 da imagem da retirada (assinatura ou foto)",
    }),
  }),
);

/**
 * Schema para listagem e filtros
 */
export const listEntregaSchema = z.object({
  condominio_id: z
    .string()
    .trim()
    .uuid()
    .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
  status: z
    .enum(["entregue", "recebido", "cancelada"])
    .optional()
    .openapi({ example: "entregue" }),
  bloco: z.string().optional().openapi({ example: "A" }),
  numero: z.string().optional().openapi({ example: "101" }),
  unidade: z
    .string()
    .optional()
    .openapi({ example: "101", description: "Alias para numero" }),
  codigo_rastreio: z.string().optional().openapi({ example: "AA123456789BR" }),
  retirada_urgente: z.string().optional().openapi({ example: "true" }),
  data_inicio: z.string().optional().openapi({ example: "2023-01-01" }),
  data_fim: z.string().optional().openapi({ example: "2023-01-31" }),
  page: z.coerce.number().min(1).default(1).openapi({ example: 1 }),
  limit: z.coerce.number().min(1).max(100).default(10).openapi({ example: 10 }),
});

// Tipos inferidos
export type CreateEntregaDTO = z.infer<typeof createEntregaSchema>;
export type RegistrarRetiradaManualDTO = z.infer<
  typeof registrarRetiradaManualSchema
>;
export type ListEntregaFilters = z.infer<typeof listEntregaSchema>;
