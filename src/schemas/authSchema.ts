import { z } from "zod";
import { registry } from "../config/openApiRegistry";

export const loginSchema = registry.register(
  "LoginInput",
  z.object({
    // Remove caracteres não numéricos do CPF antes de validar
    cpf: z
      .string()
      .transform((val) => val.replace(/\D/g, ""))
      .refine((val) => val.length === 11, "CPF deve conter 11 dígitos")
      .openapi({
        example: "123.456.789-00",
        description: "CPF do usuário (11 dígitos)",
      }),
    senha: z
      .string()
      .min(1, "Senha é obrigatória")
      .openapi({ example: "senhaSegura123", description: "Senha de acesso" }),
  }),
);

export type LoginDTO = z.infer<typeof loginSchema>;

// Interface para o usuário injetado pelo middleware (Auth)
export interface UsuarioAuth {
  id: string;
  conta_id: string;
  perfil?: string;
  isMaster?: boolean;
}
