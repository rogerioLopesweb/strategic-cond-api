import { z } from "zod";
import { registry } from "@shared/infra/http/openapi/registry";

// --- 1. SCHEMAS DE REQUISIÇÃO ---

export const createBaseConhecimentoSchema = z
  .object({
    condominio_id: z.string().uuid("ID do condomínio inválido").optional(), // Opcional pois o controller tenta pegar do Token
    titulo: z.string().min(3, "O título deve ter no mínimo 3 caracteres"),
    categoria: z.string().min(2, "Categoria é obrigatória"),
    descricao: z.string().min(5, "A descrição deve ter no mínimo 5 caracteres"),
  })
  .openapi("CreateBaseConhecimentoBody");

export const updateBaseConhecimentoSchema = z
  .object({
    condominio_id: z.string().uuid("ID do condomínio inválido").optional(),
    titulo: z.string().min(3).optional(),
    categoria: z.string().min(2).optional(),
    descricao: z.string().min(5).optional(),
  })
  .openapi("UpdateBaseConhecimentoBody");

export const listBaseConhecimentoSchema = z
  .object({
    condominio_id: z.string().uuid().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    categoria: z.string().optional(),
    busca: z.string().optional(),
  })
  .openapi("ListBaseConhecimentoQuery");

// Opcional: Registra os schemas soltos no Swagger caso precise reutilizar
registry.register("CreateBaseConhecimento", createBaseConhecimentoSchema);
registry.register("UpdateBaseConhecimento", updateBaseConhecimentoSchema);
