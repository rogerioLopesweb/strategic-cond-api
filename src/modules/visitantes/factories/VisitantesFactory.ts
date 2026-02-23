import { VisitantesRepository } from "../repositories/VisitantesRepository";
import { RegistrarEntradaUseCase } from "../useCases/RegistrarEntradaUseCase";
import { RegistrarSaidaUseCase } from "../useCases/RegistrarSaidaUseCase";
import { ListarVisitasUseCase } from "../useCases/ListarVisitasUseCase"; // ✅ Adicionado
import { BuscarVisitantePorCpfUseCase } from "../useCases/BuscarVisitantePorCpfUseCase";
export class VisitantesFactory {
  static makeRegistrarEntrada(): RegistrarEntradaUseCase {
    const repository = new VisitantesRepository();
    return new RegistrarEntradaUseCase(repository);
  }

  static makeRegistrarSaida(): RegistrarSaidaUseCase {
    const repository = new VisitantesRepository();
    return new RegistrarSaidaUseCase(repository);
  }

  // ✅ Corrigido o tipo de retorno e a classe instanciada
  static makeListarVisitas(): ListarVisitasUseCase {
    const repository = new VisitantesRepository();
    return new ListarVisitasUseCase(repository);
  }

  // ✅ Adicione este novo método
  static makeBuscarPorCpf(): BuscarVisitantePorCpfUseCase {
    const repository = new VisitantesRepository();
    return new BuscarVisitantePorCpfUseCase(repository);
  }
}
