import { Usuario } from "../entities/Usuario";
import {
  CreateUsuarioDTO,
  ListUsuarioFilters,
  UpdateUsuarioDTO,
} from "../dtos/usuario.dto";
// Certifique-se de que o caminho do import abaixo está correto
import { IUsuarioDetalhadoDTO } from "../dtos/IUsuarioDetalhadoDTO";

export interface IUsuarioRepository {
  // Leitura
  listarComFiltros(
    filters: ListUsuarioFilters,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }>;

  getDetalhado(
    id: string,
    condominioId: string,
  ): Promise<IUsuarioDetalhadoDTO | null>;

  // Escrita (Transacionais)
  cadastrarCompleto(
    dados: CreateUsuarioDTO,
    senhaHash: string,
  ): Promise<{ usuarioId: string }>;

  atualizarCompleto(
    dados: UpdateUsuarioDTO,
    dataFormatada?: string | null,
  ): Promise<void>;

  // Métodos atômicos / Auth
  findByLogin(login: string): Promise<Usuario | null>;
  findByCpf(cpf: string): Promise<Usuario | null>;
  findByEmail(email: string): Promise<Usuario | null>;

  // Updates simples
  updateStatus(id: string, condominioId: string, ativo: boolean): Promise<any>;
  updatePushToken(id: string, token: string): Promise<void>;
  updateFotoUrl(id: string, url: string): Promise<void>;

  // Delete
  delete(id: string): Promise<void>;
}
