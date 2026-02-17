import { z } from "zod";
import { registry } from "@shared/infra/http/openapi/registry";

export const loginSchema = registry.register(
  "LoginInput",
  z.object({
    // 🎯 Mudamos de 'email' para 'login'
    login: z.string().min(3, "Informe um email ou CPF válido").openapi({
      example: "user@example.com", // ou "123.456.789-00"
      description: "Email ou CPF do usuário",
    }),
    senha: z.string().min(1, "Senha é obrigatória").openapi({
      example: "senhaSegura123",
      description: "Senha de acesso",
    }),
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
