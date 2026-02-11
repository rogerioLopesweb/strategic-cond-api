import { z } from "zod";
import { registry } from "../config/openApiRegistry";

export const processarFilaSchema = z.object({
  limit: z.coerce.number().min(1).max(1000).default(100).openapi({
    description: "Número máximo de notificações a processar",
    example: 50,
  }),
});

export type ProcessarFilaDTO = z.infer<typeof processarFilaSchema>;
