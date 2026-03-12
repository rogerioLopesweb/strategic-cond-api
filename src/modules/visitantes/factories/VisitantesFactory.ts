import { VisitantesRepository } from "../repositories/VisitantesRepository";
import { RegistrarEntradaUseCase } from "../useCases/RegistrarEntradaUseCase";
import { RegistrarSaidaUseCase } from "../useCases/RegistrarSaidaUseCase";
import { ListarVisitasUseCase } from "../useCases/ListarVisitasUseCase";
import { BuscarVisitantePorCpfUseCase } from "../useCases/BuscarVisitantePorCpfUseCase";

// --- Novos UseCases para CRM e Segurança ---
import { ListarVisitantesPessoasUseCase } from "../useCases/ListarVisitantesPessoasUseCase";
import { ObterDetalhesVisitanteUseCase } from "../useCases/ObterDetalhesVisitanteUseCase";
import { CadastrarVisitanteUseCase } from "../useCases/CadastrarVisitanteUseCase";
import { GerenciarRestricaoUseCase } from "../useCases/GerenciarRestricaoUseCase";

// ✅ Provider de Storage
import { DiskStorageProvider } from "@shared/providers/StorageProvider/implementations/DiskStorageProvider";

export class VisitantesFactory {
  // --- Gestão de Acessos (Movimentação) ---

  static makeRegistrarEntrada(): RegistrarEntradaUseCase {
    const repository = new VisitantesRepository();

    // 📸 1. Precisamos instanciar o StorageProvider aqui
    const storageProvider = new DiskStorageProvider();

    // 🚨 2. Agora passamos AMBOS para o UseCase
    return new RegistrarEntradaUseCase(repository, storageProvider);
  }

  static makeRegistrarSaida(): RegistrarSaidaUseCase {
    const repository = new VisitantesRepository();
    return new RegistrarSaidaUseCase(repository);
  }

  static makeListarVisitas(): ListarVisitasUseCase {
    const repository = new VisitantesRepository();
    return new ListarVisitasUseCase(repository);
  }

  static makeBuscarPorCpf(): BuscarVisitantePorCpfUseCase {
    const repository = new VisitantesRepository();
    return new BuscarVisitantePorCpfUseCase(repository);
  }

  // --- Gestão de Pessoas (CRM e Segurança) ---

  /** Para a lista geral de cadastros (Pessoas) */
  static makeListarVisitantesPessoas(): ListarVisitantesPessoasUseCase {
    const repository = new VisitantesRepository();
    return new ListarVisitantesPessoasUseCase(repository);
  }

  /** O motor do Modal: Detalhes + Histórico + Restrições */
  static makeObterDetalhesVisitante(): ObterDetalhesVisitanteUseCase {
    const repository = new VisitantesRepository();
    return new ObterDetalhesVisitanteUseCase(repository);
  }

  /** Cadastro fixo (pode ser usado por morador ou porteiro) */
  static makeCadastrarVisitante(): CadastrarVisitanteUseCase {
    const repository = new VisitantesRepository();
    const storageProvider = new DiskStorageProvider(); // Foto é opcional mas prevista
    return new CadastrarVisitanteUseCase(repository, storageProvider);
  }

  /** Ativa ou desativa bloqueios jurídicos/administrativos */
  static makeGerenciarRestricao(): GerenciarRestricaoUseCase {
    const repository = new VisitantesRepository();
    return new GerenciarRestricaoUseCase(repository);
  }
}