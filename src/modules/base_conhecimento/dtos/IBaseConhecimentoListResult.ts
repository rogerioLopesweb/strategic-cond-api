import { BaseConhecimento } from "../entities/BaseConhecimento";

export interface IBaseConhecimentoListResult {
  data: BaseConhecimento[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}
