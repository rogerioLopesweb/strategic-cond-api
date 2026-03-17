import { VisitantesRepository } from "../repositories/VisitantesRepository";

// --- UseCases Operacionais (Acessos / Timeline) ---
import { RegistrarEntradaUseCase } from "../useCases/RegistrarEntradaUseCase";
import { RegistrarSaidaUseCase } from "../useCases/RegistrarSaidaUseCase";
import { ListarVisitanteAcessosUseCase } from "../useCases/ListarVisitanteAcessosUseCase";
import { BuscarVisitantePorCpfUseCase } from "../useCases/BuscarVisitantePorCpfUseCase";

// --- UseCases CRM (Base de Dados) ---
import { ListarVisitantesUseCase } from "../useCases/ListarVisitantesUseCase";
import { ObterDetalhesVisitanteUseCase } from "../useCases/ObterDetalhesVisitanteUseCase";
import { CadastrarVisitanteUseCase } from "../useCases/CadastrarVisitanteUseCase";
import { UpdateVisitanteUseCase } from "../useCases/UpdateVisitanteUseCase";
import { ExcluirVisitanteUseCase } from "../useCases/ExcluirVisitanteUseCase";

// --- UseCases de Segurança (Gestão de Restrições 1:N) ---
import { RegistrarRestricaoUseCase } from "../useCases/RegistrarRestricaoUseCase";
import { UpdateRestricaoUseCase } from "../useCases/UpdateRestricaoUseCase";
import { CancelarRestricaoUseCase } from "../useCases/CancelarRestricaoUseCase";
import { ExcluirRestricaoUseCase } from "../useCases/ExcluirRestricaoUseCase";

// --- Providers (Infraestrutura) ---
import { DiskStorageProvider } from "@shared/providers/StorageProvider/implementations/DiskStorageProvider";

/**
 * VisitantesFactory: Centraliza a criação de UseCases do módulo de Visitantes.
 * Garante a Injeção de Dependências correta para manter o desacoplamento e a testabilidade.
 */
export class VisitantesFactory {
  
  // =================================================================
  // 1. GESTÃO DE ACESSOS (MOVIMENTAÇÃO / PORTARIA)
  // =================================================================

  static makeRegistrarEntrada(): RegistrarEntradaUseCase {
    const repository = new VisitantesRepository();
    const storageProvider = new DiskStorageProvider();
    return new RegistrarEntradaUseCase(repository, storageProvider);
  }

  static makeRegistrarSaida(): RegistrarSaidaUseCase {
    const repository = new VisitantesRepository();
    return new RegistrarSaidaUseCase(repository);
  }

  static makeListarVisitanteAcessos(): ListarVisitanteAcessosUseCase {
    const repository = new VisitantesRepository();
    return new ListarVisitanteAcessosUseCase(repository);
  }

  static makeBuscarVisitantePorCpf(): BuscarVisitantePorCpfUseCase {
    const repository = new VisitantesRepository();
    return new BuscarVisitantePorCpfUseCase(repository);
  }

  // =================================================================
  // 2. GESTÃO DE PESSOAS (CRM / BASE MESTRE)
  // =================================================================

  static makeListarVisitantes(): ListarVisitantesUseCase {
    const repository = new VisitantesRepository();
    return new ListarVisitantesUseCase(repository);
  }

  static makeObterDetalhesVisitante(): ObterDetalhesVisitanteUseCase {
    const repository = new VisitantesRepository();
    return new ObterDetalhesVisitanteUseCase(repository);
  }

  static makeCadastrarVisitante(): CadastrarVisitanteUseCase {
    const repository = new VisitantesRepository();
    const storageProvider = new DiskStorageProvider();
    return new CadastrarVisitanteUseCase(repository, storageProvider);
  }

  static makeUpdateVisitante(): UpdateVisitanteUseCase {
    const repository = new VisitantesRepository();
    const storageProvider = new DiskStorageProvider();
    return new UpdateVisitanteUseCase(repository, storageProvider);
  }

  static makeExcluirVisitante(): ExcluirVisitanteUseCase {
    const repository = new VisitantesRepository();
    return new ExcluirVisitanteUseCase(repository);
  }

  // =================================================================
  // 3. SEGURANÇA (BLOQUEIOS E ALERTAS)
  // =================================================================

  /** 🛡️ Cria um novo alerta restritivo */
  static makeRegistrarRestricao(): RegistrarRestricaoUseCase {
    const repository = new VisitantesRepository();
    return new RegistrarRestricaoUseCase(repository);
  }

  /** ✍️ Edita os detalhes de uma restrição existente */
  static makeUpdateRestricao(): UpdateRestricaoUseCase {
    const repository = new VisitantesRepository();
    return new UpdateRestricaoUseCase(repository);
  }

  /** 🔌 Desativa o alerta (Marca como Resolvido) */
  static makeCancelarRestricao(): CancelarRestricaoUseCase {
    const repository = new VisitantesRepository();
    return new CancelarRestricaoUseCase(repository);
  }

  /** 🗑️ Remove o registro da base de dados (Soft Delete) */
  static makeExcluirRestricao(): ExcluirRestricaoUseCase {
    const repository = new VisitantesRepository();
    return new ExcluirRestricaoUseCase(repository);
  }
}