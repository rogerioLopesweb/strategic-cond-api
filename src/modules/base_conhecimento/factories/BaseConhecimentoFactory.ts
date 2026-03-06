import { BaseConhecimentoRepository } from "../repositories/BaseConhecimentoRepository"; // Ajuste o nome se necessário
import { BaseConhecimentoController } from "../controllers/BaseConhecimentoController";
import { CadastrarBaseConhecimentoUseCase } from "../useCases/CadastrarBaseConhecimentoUseCase";
import { ListarBaseConhecimentoUseCase } from "../useCases/ListarBaseConhecimentoUseCase";
import { AtualizarBaseConhecimentoUseCase } from "../useCases/AtualizarBaseConhecimentoUseCase";
import { DeletarBaseConhecimentoUseCase } from "../useCases/DeletarBaseConhecimentoUseCase";
import { BuscarInformacaoPorIdUseCase } from "../useCases/BuscarInformacaoPorIdUseCase"; // ✅ Novo Import

export const makeBaseConhecimentoController = (): BaseConhecimentoController => {
  // 1. Instancia o repositório (Única instância para todos os Use Cases)
  const repository = new BaseConhecimentoRepository();

  // 2. Instancia cada Use Case passando o repositório
  const cadastrarUseCase = new CadastrarBaseConhecimentoUseCase(repository);
  const listarUseCase = new ListarBaseConhecimentoUseCase(repository);
  const atualizarUseCase = new AtualizarBaseConhecimentoUseCase(repository);
  const deletarUseCase = new DeletarBaseConhecimentoUseCase(repository);
  const buscarPorIdUseCase = new BuscarInformacaoPorIdUseCase(repository); // ✅ Novo Use Case

  // 3. Injeta todos os Use Cases na Controller
  return new BaseConhecimentoController(
    cadastrarUseCase,
    listarUseCase,
    atualizarUseCase,
    deletarUseCase,
    buscarPorIdUseCase, // ✅ Quinta dependência adicionada
  );
};