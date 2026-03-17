import { StatusVisita } from "../entities/VisitanteAcessos";
import { TipoVisitante } from "../entities/Visitante";

export interface IVisitaDetalhadaDTO {
  // 🆔 IDs de controle
  visita_id: string;
  
  // 📅 Datas (No JSON vêm como string ISO, no App tratamos conforme o uso)
  data_entrada: string | Date;
  data_saida?: string | Date | null;

  // 👤 Dados do Visitante
  nome_visitante: string;
  cpf_visitante: string;
  foto_url?: string | null;
  tipo: TipoVisitante;

  // 📍 Destino (Opcionais se for ADM)
  bloco?: string | null;
  unidade?: string | null;
  
  // 🤝 Autorização e Empresa
  morador_nome?: string | null; // ✅ Nome do morador que liberou
  empresa_prestadora?: string | null; // ✅ Essencial para prestadores
  
  // 📑 Informações Adicionais
  placa_veiculo?: string | null;
  status: StatusVisita;
  observacoes?: string | null;

  // 👮 Auditoria (Quem estava no posto?)
  operador_entrada_nome?: string | null;
  operador_saida_nome?: string | null;
}