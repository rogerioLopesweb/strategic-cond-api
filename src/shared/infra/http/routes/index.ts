import { Router } from "express";

// Importação das rotas dos módulos (Arquitetura Modular SOLID)
import authRouter from "../../../../modules/autenticacao/routes/auth.routes";
import usuariosRouter from "../../../../modules/usuarios/routes/usuario.routes";
import contasRouter from "../../../../modules/contas/routes/conta.routes";
import condominiosRouter from "../../../../modules/condominios/routes/condominio.routes";
import unidadesRouter from "../../../../modules/unidades/routes/unidade.routes";
import entregasRouter from "../../../../modules/entregas/routes/entrega.routes";
import notificacoesRouter from "../../../../modules/notificacoes/routes/notificacao.routes";
const routes = Router();

/**
 * 🛠️ Health Check
 * Endpoint para monitoramento da API e versão do sistema.
 */
routes.get("/health", (req, res) => {
  return res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "StrategicCond-API",
    version: "3.0.0 (SOLID - Entregas & Notificações)",
  });
});

/**
 * 🔐 Autenticação (Login, Tokens, Perfil)
 */
routes.use("/api/auth", authRouter);

/**
 * 👥 Usuários (Gestão de perfis e dados)
 */
routes.use("/api/usuarios", usuariosRouter);

/**
 * 🏢 Contas (Administradoras/PJs)
 */
routes.use("/api/contas", contasRouter);

/**
 * 🏘️ Condomínios (Gestão de prédios/ativos)
 */
routes.use("/api/condominios", condominiosRouter);

/**
 * 🚪 Unidades (Apartamentos/Casas)
 */
routes.use("/api/unidades", unidadesRouter);

/**
 * 📦 Entregas (O coração operacional da portaria)
 */
routes.use("/api/entregas", entregasRouter);

/**
 * 🔔 Notificações (Processamento de filas Push e E-mail)
 */
routes.use("/api/notificacoes", notificacoesRouter);

// 🚀 Próximas expansões planejadas:
// routes.use("/api/visitantes", visitantesRouter);
// routes.use("/api/reservas", reservasRouter);

export default routes;
