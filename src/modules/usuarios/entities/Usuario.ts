import { Entity } from "@shared/core/Entity";

export type PerfilUsuario = "admin" | "sindico" | "porteiro" | "morador";

export interface UsuarioProps {
  nome_completo: string;
  email: string;
  senha_hash: string;
  cpf: string;
  telefone: string;
  condominio_id: string;
  perfil: PerfilUsuario;
  created_at?: Date;
}

export class Usuario extends Entity<UsuarioProps> {
  constructor(props: UsuarioProps, id?: string) {
    super(props, id);
  }
  get id(): string {
    return this._id;
  }
}
