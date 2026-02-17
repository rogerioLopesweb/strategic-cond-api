import { UnidadeRepository } from "../repositories/UnidadeRepository";
import { UnidadeController } from "../controllers/UnidadeController";
import { ListarUnidadesUseCase } from "../useCases/ListarUnidadesUseCase";
import { GerarUnidadesMassaUseCase } from "../useCases/GerarUnidadesMassaUseCase";
import { VincularMoradorUseCase } from "../useCases/VincularMoradorUseCase";
import { VincularMoradorPorTextoUseCase } from "../useCases/VincularMoradorPorTextoUseCase"; // 🔥 1. Importado
import { BuscarMoradoresUseCase } from "../useCases/BuscarMoradoresUseCase";
import { AtualizarStatusVinculoUseCase } from "../useCases/AtualizarStatusVinculoUseCase";

/**
 * Factory responsável por instanciar o módulo de Unidades.
 * Aplica a Injeção de Dependência de forma centralizada.
 */
export const makeUnidadeController = (): UnidadeController => {
  // 1. Instancia o Repositório (Fonte de dados única)
  const repository = new UnidadeRepository();

  // 2. Instancia os Use Cases injetando o repositório
  const listarUnidadesUseCase = new ListarUnidadesUseCase(repository);
  const gerarUnidadesMassaUseCase = new GerarUnidadesMassaUseCase(repository);
  const vincularMoradorUseCase = new VincularMoradorUseCase(repository);
  const vincularPorTextoUseCase = new VincularMoradorPorTextoUseCase(
    repository,
  ); // 🔥 2. Instanciado
  const buscarMoradoresUseCase = new BuscarMoradoresUseCase(repository);
  const atualizarStatusVinculoUseCase = new AtualizarStatusVinculoUseCase(
    repository,
  );

  // 3. Injeta todos os 6 Use Cases na Controller na ordem correta
  return new UnidadeController(
    listarUnidadesUseCase,
    gerarUnidadesMassaUseCase,
    vincularMoradorUseCase,
    vincularPorTextoUseCase, // 🔥 3. Agora o 4º argumento está aqui!
    buscarMoradoresUseCase,
    atualizarStatusVinculoUseCase,
  );
};
