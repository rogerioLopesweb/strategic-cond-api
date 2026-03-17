import { IVisitantesRepository } from "../repositories/IVisitantesRepository";
import { IStorageProvider } from "@shared/providers/StorageProvider/models/IStorageProvider";
import { Visitante } from "../entities/Visitante";
import { AppError } from "@shared/errors/AppError";
import { ICreateVisitanteDTO } from "../dtos/ICreateVisitanteDTO"; // ✅ Usando o DTO que revisamos

export class CadastrarVisitanteUseCase {
  constructor(
    private repository: IVisitantesRepository,
    private storageProvider: IStorageProvider 
  ) {}

  async execute(dados: ICreateVisitanteDTO) {
    // 🛡️ 1. Limpeza e Validação de CPF
    const cpfLimpo = dados.cpf.replace(/\D/g, "");

    if (cpfLimpo.length !== 11) {
      throw new AppError("CPF inválido. Certifique-se de enviar os 11 dígitos.", 400);
    }

    // 🛡️ 2. Validação de Contexto (Obrigatórios para o StrategicCond)
    if (!dados.condominio_id) {
      throw new AppError("O ID do condomínio é obrigatório para realizar o cadastro.", 400);
    }

    if (!dados.operador_id) {
      throw new AppError("ID do operador não informado para auditoria.", 400);
    }

    // 🛡️ 3. Isolamento Multi-tenant (Evita duplicidade no MESMO condomínio)
    // Se a mesma pessoa for em outro condomínio da sua rede, ela terá um novo perfil lá.
    const existeNoCondominio = await this.repository.findByCpf(cpfLimpo, dados.condominio_id);
    
    if (existeNoCondominio) {
      throw new AppError("Este visitante já possui um cadastro ativo neste condomínio.", 409);
    }

    // 📸 4. Gerenciamento de Foto (Processamento da Imagem)
    let urlFotoFinal = null;

    if (dados.foto_base64 && dados.foto_base64.trim() !== "") {
      // Fazemos o upload e recebemos o path interno do storage
      const path = await this.storageProvider.uploadFoto(
        dados.foto_base64,
        `visitante-${cpfLimpo}-${Date.now()}`
      );

      if (path) {
        // Transformamos o path em uma URL pública para o Front-end
        urlFotoFinal = await this.storageProvider.gerarLinkVisualizacao(path);
      }
    }

    // 🏗️ 5. Instanciação da Entidade
    const novoVisitante = new Visitante({
      nome_completo: dados.nome_completo,
      cpf: cpfLimpo,
      rg: dados.rg,
      empresa: dados.empresa,
      foto_url: urlFotoFinal,
      tipo: dados.tipo || "visitante",
      condominio_id: dados.condominio_id, // ✅ Vínculo mestre
      operador_cadastro_id: dados.operador_id, // ✅ Auditoria
    });

    // 🚀 6. Persistência
    return await this.repository.createVisitante(novoVisitante);
  }
}