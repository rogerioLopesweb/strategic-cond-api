export interface IRegistrarEntradaDataDTO {
  // 👤 Dados do Visitante (Pessoa)
  nome_completo: string;
  cpf: string;
  rg?: string | null;
  
  // 📸 ESSENCIAL: Mudamos de foto_url para foto_base64
  // É aqui que a string da câmera do celular vai viajar até o servidor
  foto_base64?: string | null; 
  
  tipo_padrao: "visitante" | "prestador" | "corretor";
  
  // 🏢 Empresa fixa no cadastro do visitante (Ex: "Porto Seguro")
  empresa?: string | null; 

  // 🚪 Dados da Visita (O evento de entrada)
  condominio_id: string;
  unidade_id?: string | null;
  autorizado_por_id?: string | null;
  placa_veiculo?: string | null;
  
  // ✅ Empresa que ele está representando HOJE (Ex: "Terceirizada X")
  empresa_prestadora?: string | null; 
  
  observacoes?: string | null;
}