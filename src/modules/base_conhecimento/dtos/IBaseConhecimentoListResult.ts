import { BaseConhecimento } from "../entities/BaseConhecimento";

export interface IBaseConhecimentoListResult {
  data: BaseConhecimento[];
  total: number;
}
