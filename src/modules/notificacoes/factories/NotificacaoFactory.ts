// Providers de Infraestrutura
import { NodemailerMailProvider } from "@shared/providers/notificacoes/email/implementations/NodemailerMailProvider";
import { ExpoPushProvider } from "@shared/providers/notificacoes/push/implementations/ExpoPushProvider";
// Repositórios
import { NotificacaoRepository } from "../repositories/NotificacaoRepository";
import { NotificacaoController } from "../controllers/NotificacaoController";
import { ProcessarFilaEmailUseCase } from "../useCases/ProcessarFilaEmailUseCase";
import { ProcessarFilaPushUseCase } from "../useCases/ProcessarFilaPushUseCase";

/**
 * NotificacaoFactory
 * Centraliza a injeção de dependências do módulo de comunicações.
 */
export const makeNotificacaoController = (): NotificacaoController => {
  // 1. Repositório (Acesso ao Banco de Dados)
  const repository = new NotificacaoRepository();

  // 2. Providers (Motores de Envio Externos)
  const mailProvider = new NodemailerMailProvider();
  const pushProvider = new ExpoPushProvider();

  // 3. Use Cases (Injetando Repository + Provedores Específicos)
  const processarFilaEmailUseCase = new ProcessarFilaEmailUseCase(
    repository,
    mailProvider,
  );

  const processarFilaPushUseCase = new ProcessarFilaPushUseCase(
    repository,
    pushProvider,
  );

  // 4. Controller (Orquestrador de Rotas)
  return new NotificacaoController(
    processarFilaEmailUseCase,
    processarFilaPushUseCase,
  );
};
