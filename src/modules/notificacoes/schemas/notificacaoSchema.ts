import { z } from "zod";
import { registry } from "@shared/infra/http/openapi/registry";

/**
 * Schema para processamento de filas (Push e Email)
 * Valida o limite de registros por execução para evitar sobrecarga no servidor.
 */
export const processarFilaSchema = registry.register(
  "ProcessarFilaInput",
  z.object({
    limit: z.coerce
      .number()
      .min(1, "O limite mínimo é 1")
      .max(1000, "O limite máximo por execução é 1000")
      .default(100)
      .openapi({
        description: "Número máximo de notificações a processar nesta execução",
        example: 50,
      }),
  }),
);

/**
 * Schema opcional para consulta de status de notificação
 */
export const consultaNotificacaoSchema = z.object({
  usuario_id: z.string().uuid().optional(),
  status: z.enum(["pendente", "enviado", "erro"]).optional(),
});

// Tipos inferidos para uso nos Use Cases e Controllers
export type ProcessarFilaDTO = z.infer<typeof processarFilaSchema>;
export type ConsultaNotificacaoDTO = z.infer<typeof consultaNotificacaoSchema>;
