import { z } from "zod";
import { registry } from "@shared/infra/http/openapi/registry";

/**
 * 🔍 Schema para listagem de unidades (Query Params)
 */
export const listUnidadeSchema = z.object({
  condominio_id: z
    .string()
    .uuid()
    .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
  bloco: z.string().trim().optional().openapi({ example: "A" }),
  unidade: z.string().trim().optional().openapi({ example: "101" }),
  page: z.coerce.number().min(1).default(1).openapi({ example: 1 }),
  limit: z.coerce.number().min(1).max(100).default(10).openapi({ example: 10 }),
});

/**
 * 🏗️ Schema para geração em massa de unidades
 */
export const gerarUnidadesSchema = registry.register(
  "GerarUnidadesInput",
  z.object({
    condominio_id: z
      .string()
      .uuid()
      .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
    blocos: z.array(z.string().trim().min(1)).openapi({ example: ["A", "B"] }),
    inicio: z.number().int().min(0).openapi({ example: 101 }),
    fim: z.number().int().min(1).openapi({ example: 110 }),
  }),
);

/**
 * 👥 Schema para buscar moradores de uma unidade específica
 */
export const buscarMoradoresSchema = z.object({
  condominio_id: z
    .string()
    .trim()
    .uuid()
    .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
  bloco: z.string().trim().min(1).openapi({ example: "A" }),
  unidade: z.string().trim().min(1).openapi({ example: "101" }),
});

/**
 * 🔗 Schema para vincular morador via ID da unidade
 */
export const vincularMoradorSchema = registry.register(
  "VincularMoradorInput",
  z.object({
    usuario_id: z
      .string()
      .uuid()
      .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
    condominio_id: z
      .string()
      .uuid()
      .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
    unidade_id: z
      .string()
      .uuid()
      .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
    tipo_vinculo: z.string().trim().min(1).openapi({ example: "proprietario" }),
  }),
);

/**
 * 텍 Schema para vincular morador via Texto (Bloco/Número)
 * Essencial para o VincularMoradorPorTextoUseCase
 */
export const vincularMoradorPorTextoSchema = registry.register(
  "VincularMoradorTextoInput",
  z.object({
    usuario_id: z
      .string()
      .uuid()
      .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
    condominio_id: z
      .string()
      .uuid()
      .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
    identificador_bloco: z.string().trim().min(1).openapi({ example: "A" }),
    numero: z.string().trim().min(1).openapi({ example: "101" }),
    tipo_vinculo: z.string().trim().min(1).openapi({ example: "inquilino" }),
  }),
);

/**
 * 🔄 Schema para atualizar status do vínculo (Saída)
 */
export const atualizarStatusVinculoSchema = registry.register(
  "AtualizarStatusVinculoInput",
  z.object({
    usuario_id: z
      .string()
      .uuid()
      .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
    unidade_id: z
      .string()
      .uuid()
      .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
    status: z
      .boolean()
      .openapi({ description: "false para registrar saída", example: false }),
  }),
);

// --- EXPORTAÇÃO DE TIPOS (Inferência) ---

export type ListUnidadeFilters = z.infer<typeof listUnidadeSchema>;
export type GerarUnidadesDTO = z.infer<typeof gerarUnidadesSchema>;
export type BuscarMoradoresDTO = z.infer<typeof buscarMoradoresSchema>;
export type VincularMoradorDTO = z.infer<typeof vincularMoradorSchema>;
export type VincularMoradorPorTextoDTO = z.infer<
  typeof vincularMoradorPorTextoSchema
>;
export type AtualizarStatusVinculoDTO = z.infer<
  typeof atualizarStatusVinculoSchema
>;
