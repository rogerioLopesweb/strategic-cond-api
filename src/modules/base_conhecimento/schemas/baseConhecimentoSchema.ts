import { z } from "zod";
import { registry } from "@shared/infra/http/openapi/registry";

// --- 1. SCHEMAS DE REQUISIÇÃO ---

export const createBaseConhecimentoBodySchema = z
  .object({
    condominio_id: z.string().uuid("ID do condomínio inválido").optional(),
    titulo: z.string().min(3, "O título deve ter no mínimo 3 caracteres"),
    categoria: z.string().min(2, "Categoria é obrigatória"),
    descricao: z.string().min(5, "A descrição deve ter no mínimo 5 caracteres"),
  })
  .openapi("CreateBaseConhecimentoBody");

export const updateBaseConhecimentoBodySchema = z
  .object({
    condominio_id: z.string().uuid("ID do condomínio inválido").optional(),
    titulo: z.string().min(3).optional(),
    categoria: z.string().min(2).optional(),
    descricao: z.string().min(5).optional(),
  })
  .openapi("UpdateBaseConhecimentoBody");

export const listBaseConhecimentoQuerySchema = z
  .object({
    condominio_id: z.string().uuid().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    categoria: z.string().optional(),
    busca: z.string().optional(),
  })
  .openapi("ListBaseConhecimentoQuery");

// ✅ 2. SCHEMA DE PARÂMETROS DE ROTA (Path Params)
export const baseConhecimentoParamsSchema = z
  .object({
    id: z.string().uuid("O ID da informação deve ser um UUID válido"),
  })
  .openapi("BaseConhecimentoParams");

// ✅ 3. SCHEMA DE RESPOSTA (O Objeto Completo)
export const baseConhecimentoResponseSchema = z
  .object({
    id: z.string().uuid(),
    condominio_id: z.string().uuid(),
    titulo: z.string(),
    categoria: z.string(),
    descricao: z.string(),
    id_user_cadastrou: z.string().uuid(),
    id_user_alterou: z.string().uuid().nullable().optional(),
    data_cadastro: z.date().or(z.string()),
    data_alteracao: z.date().or(z.string()),
  })
  .openapi("BaseConhecimentoResponse");

// --- 4. REGISTRO NO OPENAPI ---

registry.register("BaseConhecimento", baseConhecimentoResponseSchema);
registry.register("CreateBaseConhecimento", createBaseConhecimentoBodySchema);
registry.register("UpdateBaseConhecimento", updateBaseConhecimentoBodySchema);
registry.register("BaseConhecimentoParams", baseConhecimentoParamsSchema);