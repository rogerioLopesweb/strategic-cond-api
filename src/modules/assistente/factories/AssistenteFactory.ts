import { AssistenteController } from "../controllers/AssistenteController";
import { EnviarMensagemAssistenteUseCase } from "../useCases/EnviarMensagemAssistenteUseCase";
import { ConsultarRegimentoTool } from "../tools/ConsultarRegimentoTool";
import { BaseConhecimentoRepository } from "@modules/base_conhecimento/repositories/BaseConhecimentoRepository";

// 👇 NOVO: Importamos o repositório responsável por salvar as sessões e mensagens no banco
import { AssistenteRepository } from "../repositories/AssistenteRepository";
import { BuscarHistoricoUseCase } from "../useCases/BuscarHistoricoUseCase";

// 👇 Importações de Entregas comentadas para ficarem em Standby
// import { ListarEntregasUseCase } from "@modules/entregas/useCases/ListarEntregasUseCase";
// import { EntregaRepository } from "@modules/entregas/repositories/EntregaRepository";
// import { VerificarEncomendasTool } from "../tools/VerificarEncomendasTool";

export function makeAssistenteController(): AssistenteController {
  // =========================================================
  // 📦 MÓDULO DE ENTREGAS (EM STANDBY)
  // =========================================================
  // const entregaRepository = new EntregaRepository();
  // const listarEntregasUseCase = new ListarEntregasUseCase(entregaRepository);
  // const verificarEncomendasTool = new VerificarEncomendasTool(listarEntregasUseCase);

  // =========================================================
  // 📖 MÓDULO DE REGRAS E REGIMENTO (ATIVO)
  // =========================================================
  // 1. Instanciamos a conexão com o banco de dados das regras
  const baseConhecimentoRepository = new BaseConhecimentoRepository();

  // 2. Injetamos o banco dentro da ferramenta do Otto
  const consultarRegimentoTool = new ConsultarRegimentoTool(
    baseConhecimentoRepository,
  );

  // =========================================================
  // 🧠 MÓDULO DO ASSISTENTE (CÉREBRO E MEMÓRIA)
  // =========================================================
  // 3. Instanciamos o repositório que gerencia as sessões e o histórico do chat
  const assistenteRepository = new AssistenteRepository();

  // 4. Injeta a lista de ferramentas (Skills) e a MEMÓRIA (Repository) no cérebro do assistente
  const enviarMensagemUseCase = new EnviarMensagemAssistenteUseCase(
    [
      consultarRegimentoTool, // Apenas o Regimento está ativo agora
      // verificarEncomendasTool, // <- Descomente no futuro quando quiser reativar
    ],
    assistenteRepository, // 👈 A dependência injetada que dá memória ao Otto na hora de falar!
  );

  // 👇 5. Instancia o UseCase de Histórico (para carregar a tela quando o usuário abre o app)
  const buscarHistoricoUseCase = new BuscarHistoricoUseCase(
    assistenteRepository,
  );

  // 👇 6. Injeta os DOIS UseCases no Controller
  return new AssistenteController(
    enviarMensagemUseCase,
    buscarHistoricoUseCase,
  );
}
