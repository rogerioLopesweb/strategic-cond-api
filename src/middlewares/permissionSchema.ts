import { z } from "zod";

/**
 * Valida o ID do condomínio se ele estiver presente na requisição.
 * Aceita string UUID ou undefined/null.
 */
export const contextCondominioSchema = z.string().uuid().optional().nullable();

// Tipo inferido
export type ContextCondominioDTO = z.infer<typeof contextCondominioSchema>;
