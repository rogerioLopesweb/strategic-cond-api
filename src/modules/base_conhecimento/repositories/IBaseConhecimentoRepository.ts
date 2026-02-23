import { IBaseConhecimentoListResult } from "../dtos/IBaseConhecimentoListResult";
import { ICreateBaseConhecimentoDTO } from "../dtos/ICreateBaseConhecimentoDTO";
import { IListBaseConhecimentoFilters } from "../dtos/IListBaseConhecimentoFilters";
import { IUpdateBaseConhecimentoDTO } from "../dtos/IUpdateBaseConhecimentoDTO";
import { BaseConhecimento } from "../entities/BaseConhecimento";

export interface IBaseConhecimentoRepository {
  create(data: ICreateBaseConhecimentoDTO): Promise<BaseConhecimento>;

  update(
    id: string,
    condominio_id: string,
    data: IUpdateBaseConhecimentoDTO,
  ): Promise<BaseConhecimento | null>;

  findById(id: string, condominio_id: string): Promise<BaseConhecimento | null>;

  findAll(
    condominio_id: string,
    filters: IListBaseConhecimentoFilters,
  ): Promise<IBaseConhecimentoListResult>;

  delete(
    id: string,
    condominio_id: string,
    id_user_alterou: string,
  ): Promise<boolean>;

  // 🧠 Método EXCLUSIVO para o Otto consumir de forma rápida e barata
  buscarParaIA(condominio_id: string): Promise<BaseConhecimento[]>;
}
