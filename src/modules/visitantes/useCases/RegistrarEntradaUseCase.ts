import { IVisitantesRepository } from "../repositories/IVisitantesRepository";
import { Visitante } from "../entities/Visitante";
import { VisitanteAcessos } from "../entities/VisitanteAcessos";
import { IStorageProvider } from "@shared/providers/StorageProvider/models/IStorageProvider";
import { AppError } from "@shared/errors/AppError";

interface IEntradaRequest {
  nome_completo: string;
  cpf: string;
  rg?: string;
  foto_base64?: string;
  tipo: "visitante" | "prestador" | "corretor";
  empresa?: string;
  condominio_id: string; // Contexto garantido pelo Controller/Token
  unidade_id?: string;
  autorizado_por_id?: string;
  placa_veiculo?: string;
  empresa_prestadora?: string;
  observacoes?: string;
  operador_id: string; 
}

export class RegistrarEntradaUseCase {
  constructor(
    private visitantesRepository: IVisitantesRepository,
    private storageProvider: IStorageProvider,
  ) {}

  async execute(dados: IEntradaRequest): Promise<VisitanteAcessos> {
    const cpfLimpo = dados.cpf.replace(/\D/g, "");
    const { condominio_id, operador_id } = dados;
    
    // 🛡️ 1. CRIVO DE SEGURANÇA (Pente Fino)
    // Buscamos o visitante no contexto do condomínio atual
    let visitante = await this.visitantesRepository.findByCpf(cpfLimpo, condominio_id);
    
    if (visitante) {
      // Verifica impedimentos ANTES de processar foto ou qualquer dado
      const restricao = await this.visitantesRepository.verificarRestricaoAtiva(
        String(visitante.id), 
        condominio_id
      );

      if (restricao) {
        throw new AppError(
          `ACESSO BLOQUEADO: Este visitante possui uma restrição ativa (${restricao.tipo_restricao}). Motivo: ${restricao.descricao}`,
          403
        );
      }
    }

    // 📸 2. GESTÃO DE IMAGEM (Otimização de Storage)
    let urlFotoFinal: string | null = visitante?.props.foto_url || null;

    // Se o porteiro capturou uma nova foto no momento da entrada, fazemos o upload
    if (dados.foto_base64 && dados.foto_base64.trim() !== "") {
      const fileName = `visitante-${cpfLimpo}-${Date.now()}`;
      const path = await this.storageProvider.uploadFoto(dados.foto_base64, fileName);
      if (path) {
        urlFotoFinal = await this.storageProvider.gerarLinkVisualizacao(path);
      }
    }

    // 👤 3. GESTÃO DO PERFIL (CRM)
    if (!visitante) {
      // Criação de novo perfil vinculado ao condomínio
      visitante = new Visitante({
        condominio_id,
        nome_completo: dados.nome_completo,
        cpf: cpfLimpo,
        rg: dados.rg,
        foto_url: urlFotoFinal,
        tipo: dados.tipo,
        empresa: dados.empresa,
        operador_cadastro_id: operador_id,
      });

      visitante = await this.visitantesRepository.createVisitante(visitante);
    } else {
      // Atualização inteligente: Se mudou a empresa ou foto, atualizamos o cadastro mestre
      visitante.atualizarDados({
        nome_completo: dados.nome_completo,
        rg: dados.rg || visitante.props.rg,
        foto_url: urlFotoFinal,
        tipo: dados.tipo,
        empresa: dados.empresa || visitante.props.empresa
      }, operador_id);

      await this.visitantesRepository.updateVisitante(visitante, operador_id);
    }

    if (!visitante?.id) {
      throw new AppError("Falha crítica ao identificar ou registrar perfil do visitante.");
    }

    // 🚪 4. REGISTRO DO ACESSO (O Evento na Timeline)
    const acesso = new VisitanteAcessos({
      condominio_id,
      visitante_id: visitante.id,
      unidade_id: dados.unidade_id,
      autorizado_por_id: dados.autorizado_por_id,
      placa_veiculo: dados.placa_veiculo,
      operador_entrada_id: operador_id,
      // Prioridade de empresa: 1. Informada na entrada, 2. No cadastro, 3. Nula
      empresa_prestadora: dados.empresa_prestadora || dados.empresa || visitante.props.empresa,
      observacoes: dados.observacoes
    });

    // Salva na tabela 'visitante_acessos' e dispara notificações
    return await this.visitantesRepository.registrarEntrada(acesso, operador_id);
  }
}