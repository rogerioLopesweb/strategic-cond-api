import { CondominioRepository } from "../repositories/CondominioRepository"; // Ajuste o caminho conforme sua estrutura
import { CondominioController } from "../controllers/CondominioController";
import { CadastrarCondominioUseCase } from "../useCases/CadastrarCondominioUseCase";
import { ListarCondominiosUseCase } from "../useCases/ListarCondominiosUseCase";
import { BuscarCondominioUseCase } from "../useCases/BuscarCondominioUseCase";
import { AtualizarCondominioUseCase } from "../useCases/AtualizarCondominioUseCase";
import { ListarCondominiosAuthUseCase } from "../useCases/ListarCondominiosAuthUseCase";

export class CondominiosFactory {
  // 1. Instancia o Controller (Agora sem argumentos)
  static makeController(): CondominioController {
    return new CondominioController();
  }

  // 2. Methods Static para cada UseCase (Chamados dentro do Controller)

  static makeCadastrar(): CadastrarCondominioUseCase {
    const repository = new CondominioRepository();
    return new CadastrarCondominioUseCase(repository);
  }

  static makeListar(): ListarCondominiosUseCase {
    const repository = new CondominioRepository();
    return new ListarCondominiosUseCase(repository);
  }

  static makeBuscar(): BuscarCondominioUseCase {
    const repository = new CondominioRepository();
    return new BuscarCondominioUseCase(repository);
  }

  static makeAtualizar(): AtualizarCondominioUseCase {
    const repository = new CondominioRepository();
    return new AtualizarCondominioUseCase(repository);
  }

  // ✅ Novo UseCase para Auth (Leve)
  static makeListarAuth(): ListarCondominiosAuthUseCase {
    const repository = new CondominioRepository();
    return new ListarCondominiosAuthUseCase(repository);
  }
}
