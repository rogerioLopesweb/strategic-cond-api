import { ContaRepository } from "../repositories/ContaRepository";
import { CriarContaUseCase } from "../useCases/CriarContaUseCase";
import { ListarContasUseCase } from "../useCases/ListarContasUseCase";
import { AtualizarContaUseCase } from "../useCases/AtualizarContaUseCase";
import { BuscarContaUseCase } from "../useCases/BuscarContaUseCase";
import { FindContaMasterUseCase } from "../useCases/FindContaMasterUseCase"; // ✅ Novo
import { ContaController } from "../controllers/ContaController"; // ✅ Importe o Controller
export class ContasFactory {
  // ✅ Adicione este método para criar o controller
  static makeController(): ContaController {
    return new ContaController();
  }
  static makeCriarConta(): CriarContaUseCase {
    return new CriarContaUseCase(new ContaRepository());
  }

  static makeListarContas(): ListarContasUseCase {
    return new ListarContasUseCase(new ContaRepository());
  }

  static makeBuscarConta(): BuscarContaUseCase {
    return new BuscarContaUseCase(new ContaRepository());
  }

  static makeAtualizarConta(): AtualizarContaUseCase {
    return new AtualizarContaUseCase(new ContaRepository());
  }

  // ✅ Adicionado para uso no Controller
  static makeFindContaMaster(): FindContaMasterUseCase {
    return new FindContaMasterUseCase(new ContaRepository());
  }
}
