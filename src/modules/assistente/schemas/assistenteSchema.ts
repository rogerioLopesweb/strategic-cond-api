import { z } from "zod";
import { registry } from "@shared/infra/http/openapi/registry";

/**
 * Schema para envio de mensagem ao Assistente Virtual (Chat)
 */
export const chatAssistenteSchema = registry.register(
  "ChatAssistenteInput",
  z.object({
    mensagem: z
      .string()
      .min(1, "A mensagem não pode estar vazia")
      .openapi({ example: "Bom dia, chegou alguma encomenda para o 101 A?" }),
    condominio_id: z.string().trim().uuid().optional().openapi({
      example: "123e4567-e89b-12d3-a456-426614174000",
      description:
        "Opcional no body caso seja enviado via header x-condominio-id",
    }),
  }),
);

// Tipos inferidos
export type ChatAssistenteDTO = z.infer<typeof chatAssistenteSchema>;
