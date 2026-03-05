import { VisitantesRepository } from "../repositories/VisitantesRepository";
import { RegistrarEntradaUseCase } from "../useCases/RegistrarEntradaUseCase";
import { RegistrarSaidaUseCase } from "../useCases/RegistrarSaidaUseCase";
import { ListarVisitasUseCase } from "../useCases/ListarVisitasUseCase";
import { BuscarVisitantePorCpfUseCase } from "../useCases/BuscarVisitantePorCpfUseCase";

// ✅ Importe o seu provider de Storage (ex: DiskStorageProvider ou S3StorageProvider)
import { DiskStorageProvider } from "@shared/providers/StorageProvider/implementations/DiskStorageProvider";

export class VisitantesFactory {
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
}
