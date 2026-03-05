import { IVisitantesRepository } from "../repositories/IVisitantesRepository";
import { Visitante } from "../entities/Visitante";
import { Visita } from "../entities/Visita";
import { IStorageProvider } from "@shared/providers/StorageProvider/models/IStorageProvider";
import { AppError } from "@shared/errors/AppError";

interface IEntradaRequest {
  nome_completo: string;
  cpf: string;
  rg?: string;
  foto_base64?: string;
  tipo_padrao: "visitante" | "prestador" | "corretor";
  empresa?: string; // Empresa do cadastro fixo
  condominio_id: string;
  unidade_id?: string;
  autorizado_por_id?: string;
  placa_veiculo?: string;
  empresa_prestadora?: string; // Empresa desta visita específica
  observacoes?: string;
  operador_id: string;
}

export class RegistrarEntradaUseCase {
  constructor(
    private visitantesRepository: IVisitantesRepository,
    private storageProvider: IStorageProvider,
  ) {}

  async execute(dados: IEntradaRequest): Promise<Visita> {
    const cpfLimpo = dados.cpf.replace(/\D/g, "");
    let visitante = await this.visitantesRepository.findByCpf(cpfLimpo);

    // 📸 Gerenciamento de Foto
    let urlFotoFinal: string | null = visitante?.props.foto_url || null;

    if (dados.foto_base64) {
      const fileName = `visitante-${cpfLimpo}-${Date.now()}`;
      const path = await this.storageProvider.uploadFoto(
        dados.foto_base64,
        fileName,
      );
      if (path) {
        urlFotoFinal = await this.storageProvider.gerarLinkVisualizacao(path);
      }
    }

    // 2. Fluxo de Criação ou Atualização do Visitante (Pessoa)
    if (!visitante) {
      visitante = new Visitante({
        nome_completo: dados.nome_completo,
        cpf: cpfLimpo,
        rg: dados.rg,
        foto_url: urlFotoFinal,
        tipo_padrao: dados.tipo_padrao,
        empresa: dados.empresa, // ✅ Agora salva no cadastro permanente
      });

      visitante = await this.visitantesRepository.createVisitante(visitante);
    } else {
      const visitanteAtualizado = new Visitante(
        {
          nome_completo: dados.nome_completo,
          cpf: cpfLimpo,
          rg: dados.rg || visitante.props.rg,
          foto_url: urlFotoFinal,
          tipo_padrao: dados.tipo_padrao,
          empresa: dados.empresa || visitante.props.empresa, // ✅ Mantém ou atualiza
          created_at: visitante.props.created_at,
        },
        visitante.id,
      );

      await this.visitantesRepository.updateVisitante(visitanteAtualizado);
      visitante = visitanteAtualizado;
    }

    if (!visitante?.id) {
      throw new AppError(
        "Não foi possível gerar ou recuperar a identificação do visitante.",
      );
    }

    // 3. Registrar a Visita (Evento de Acesso)
    const visita = new Visita({
      condominio_id: dados.condominio_id,
      visitante_id: visitante.id,
      unidade_id: dados.unidade_id,
      autorizado_por_id: dados.autorizado_por_id,
      placa_veiculo: dados.placa_veiculo,
      // ✅ Fallback estratégico: Se não informou empresa na visita, usa a do cadastro.
      empresa_prestadora:
        dados.empresa_prestadora || dados.empresa || visitante.props.empresa,
      observacoes: dados.observacoes,
    });

    return await this.visitantesRepository.registrarEntrada(
      visita,
      dados.operador_id,
    );
  }
}
