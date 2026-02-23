import { BaseConhecimentoRepository } from "../repositories/BaseConhecimentoRepository";
import { BaseConhecimentoController } from "../controllers/BaseConhecimentoController";
import { CadastrarBaseConhecimentoUseCase } from "../useCases/CadastrarBaseConhecimentoUseCase";
import { ListarBaseConhecimentoUseCase } from "../useCases/ListarBaseConhecimentoUseCase";
import { AtualizarBaseConhecimentoUseCase } from "../useCases/AtualizarBaseConhecimentoUseCase";
import { DeletarBaseConhecimentoUseCase } from "../useCases/DeletarBaseConhecimentoUseCase";

export const makeBaseConhecimentoController =
  (): BaseConhecimentoController => {
    const repository = new BaseConhecimentoRepository();

    const cadastrarUseCase = new CadastrarBaseConhecimentoUseCase(repository);
    const listarUseCase = new ListarBaseConhecimentoUseCase(repository);
    const atualizarUseCase = new AtualizarBaseConhecimentoUseCase(repository);
    const deletarUseCase = new DeletarBaseConhecimentoUseCase(repository);

    return new BaseConhecimentoController(
      cadastrarUseCase,
      listarUseCase,
      atualizarUseCase,
      deletarUseCase,
    );
  };
