import { AssistenteController } from "../controllers/AssistenteController";
import { EnviarMensagemAssistenteUseCase } from "../useCases/EnviarMensagemAssistenteUseCase";
import { ConsultarRegimentoTool } from "../tools/ConsultarRegimentoTool";
// 👇 Importamos o repositório real da nossa Base de Conhecimento
import { BaseConhecimentoRepository } from "@modules/base_conhecimento/repositories/BaseConhecimentoRepository";

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
  // 1. Instanciamos a conexão com o banco de dados
  const baseConhecimentoRepository = new BaseConhecimentoRepository();

  // 2. Injetamos o banco dentro da ferramenta do Otto
  const consultarRegimentoTool = new ConsultarRegimentoTool(
    baseConhecimentoRepository,
  );

  // 🧠 Injeta a lista de ferramentas (Skills) no cérebro do assistente
  const enviarMensagemUseCase = new EnviarMensagemAssistenteUseCase([
    consultarRegimentoTool, // Apenas o Regimento está ativo agora
    // verificarEncomendasTool, // <- Descomente no futuro quando quiser reativar
  ]);

  return new AssistenteController(enviarMensagemUseCase);
}
