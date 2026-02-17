import {
  ICreateCondominioDTO,
  IUpdateCondominioDTO,
  IListCondominioFilters,
} from "../dtos/condominio.dto";
import { Condominio } from "../entities/Condominio";

// Definindo a estrutura do resultado da listagem para reutilização
export interface ICondominioListResult {
  data: Condominio[];
  total: number;
}

export interface ICondominioAuthDTO {
  id: string;
  nome_fantasia: string;
  perfil: string;
}
export interface ICondominioRepository {
  create(data: ICreateCondominioDTO, contaId: string): Promise<Condominio>;
  update(id: string, data: IUpdateCondominioDTO): Promise<Condominio | null>;
  findById(id: string): Promise<Condominio | null>;
  findByIdComVinculo(id: string, usuarioId: string): Promise<Condominio | null>;
  findByCnpj(cnpj: string, contaId: string): Promise<Condominio | null>;
  findAll(
    contaId: string,
    filters: IListCondominioFilters,
  ): Promise<ICondominioListResult>;
  // O método de listagem para usuários comuns pode ter uma assinatura diferente
  // ou ser um método separado, dependendo da regra.
  // Por simplicidade, vamos focar no findAll genérico por enquanto.
  delete(id: string): Promise<boolean>;

  // Métodos específicos que podem ser necessários
  vincularUsuario(
    condominioId: string,
    usuarioId: string,
    perfil: string,
  ): Promise<void>;

  listarParaAuth(usuarioId: string): Promise<ICondominioAuthDTO[]>;
}
