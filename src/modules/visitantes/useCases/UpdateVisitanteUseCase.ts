import { IVisitantesRepository } from "../repositories/IVisitantesRepository";
import { Visitante } from "../entities/Visitante";
import { IUpdateVisitanteDTO } from "../dtos/IUpdateVisitanteDTO";
import { IStorageProvider } from "@shared/providers/StorageProvider/models/IStorageProvider";
import { AppError } from "@shared/errors/AppError";

/**
 * UpdateVisitanteUseCase: Gerencia a alteração de dados cadastrais.
 * Garante que a foto seja processada e a auditoria seja registrada.
 */
export class UpdateVisitanteUseCase {
  constructor(
    private visitantesRepository: IVisitantesRepository,
    private storageProvider: IStorageProvider
  ) {}

  async execute(dados: IUpdateVisitanteDTO): Promise<Visitante> {
    
    // 🛡️ 1. Validação de Contexto e Existência
    // Buscamos garantindo que o visitante pertence ao condomínio (Isolamento Multi-tenant)
    const visitante = await this.visitantesRepository.findById(dados.id, dados.condominio_id);

    if (!visitante) {
      throw new AppError("Visitante não encontrado ou acesso não autorizado para edição.", 404);
    }

    // 🛡️ 2. Validação de Auditoria
    if (!dados.operador_id) {
      throw new AppError("A identificação do operador é obrigatória para registrar esta alteração.", 400);
    }

    // 📸 3. Gestão de Imagem (Upload de nova foto se fornecida)
    let urlFotoFinal = visitante.props.foto_url;

    if (dados.foto_base64 && dados.foto_base64.trim() !== "") {
      // O path antigo poderia ser removido aqui se você quiser economizar storage
      const fileName = `visitante-${visitante.cpf}-${Date.now()}`;
      const path = await this.storageProvider.uploadFoto(
        dados.foto_base64,
        fileName
      );

      if (path) {
        urlFotoFinal = await this.storageProvider.gerarLinkVisualizacao(path);
      }
    }

    // ✍️ 4. Aplicação das Regras de Negócio na Entidade
    // O método 'atualizarDados' da entidade já cuida de setar a data_atualizacao
    visitante.atualizarDados({
      nome_completo: dados.nome_completo,
      rg: dados.rg ?? visitante.props.rg,
      tipo: dados.tipo,
      empresa: dados.empresa ?? visitante.props.empresa,
      foto_url: urlFotoFinal,
    }, dados.operador_id);

    // 🚀 5. Persistência no Banco de Dados
    // O Repository usará o condominio_id interno da entidade para a cláusula WHERE
    await this.visitantesRepository.updateVisitante(visitante, dados.operador_id);

    return visitante;
  }
}