import { EntregaRepository } from "../repositories/EntregaRepository";
import { EntregaController } from "../controllers/EntregaController";
import { CadastrarEntregaUseCase } from "../useCases/CadastrarEntregaUseCase";
import { ListarEntregasUseCase } from "../useCases/ListarEntregasUseCase";
import { FinalizarSaidaEntregaUseCase } from "../useCases/FinalizarSaidaEntregaUseCase";
import { CancelarEntregaUseCase } from "../useCases/CancelarEntregaUseCase";
import { AtualizarEntregaUseCase } from "../useCases/AtualizarEntregaUseCase";
import { DiskStorageProvider } from "@shared/providers/StorageProvider/implementations/DiskStorageProvider";
/**
 * Factory responsável por orquestrar todas as dependências do módulo de Entregas.
 * Injeta o repositório e o provider de storage nos Use Cases necessários.
 */
export const makeEntregaController = (): EntregaController => {
  // 1. Instanciamos os provedores de Infraestrutura
  const repository = new EntregaRepository();
  const storageProvider = new DiskStorageProvider();

  // 2. Instanciamos os Use Cases (Injetando as dependências)
  const cadastrarEntregaUseCase = new CadastrarEntregaUseCase(
    repository,
    storageProvider,
  );

  const listarEntregasUseCase = new ListarEntregasUseCase(repository);

  const finalizarSaidaEntregaUseCase = new FinalizarSaidaEntregaUseCase(
    repository,
    storageProvider,
  );

  const cancelarEntregaUseCase = new CancelarEntregaUseCase(repository);

  const atualizarEntregaUseCase = new AtualizarEntregaUseCase(repository);

  // 3. Retornamos a Controller montada com todas as "ferramentas"
  return new EntregaController(
    cadastrarEntregaUseCase,
    listarEntregasUseCase,
    finalizarSaidaEntregaUseCase,
    cancelarEntregaUseCase,
    atualizarEntregaUseCase,
  );
};
