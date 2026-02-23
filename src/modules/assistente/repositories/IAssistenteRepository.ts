import { Mensagem } from "../entities/Mensagem";

export interface IAssistenteRepository {
  salvar(mensagem: Mensagem): Promise<void>;
  buscarHistorico(
    usuario_id: string,
    condominio_id: string,
  ): Promise<Mensagem[]>;
}
