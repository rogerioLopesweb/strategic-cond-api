import { IVisitaDetalhadaDTO } from "./IVisitaDetalhadaDTO";
export interface IVisitasPaginadasDTO {
  data: IVisitaDetalhadaDTO[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}
