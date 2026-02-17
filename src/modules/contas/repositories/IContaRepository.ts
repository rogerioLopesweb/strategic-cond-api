import { CreateContaDTO, UpdateContaDTO } from "../dtos/conta.dto";
export interface IContaRepository {
  listarPorDono(donoId: string): Promise<any[]>;
  criar(dados: CreateContaDTO, donoId: string): Promise<any>;
  atualizar(id: string, dados: UpdateContaDTO, donoId: string): Promise<any>;
  buscarPorId(id: string, donoId: string): Promise<any | undefined>;
  findContaMaster(usuarioId: string): Promise<string | null>;
}
