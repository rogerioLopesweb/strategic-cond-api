import "reflect-metadata"; // 🥇 Deve ser sempre o primeiro
import "dotenv/config";
import "express-async-errors"; // ⚡ Captura erros em rotas async sem precisar de try/catch
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

// Importações de infraestrutura e rotas
// 💡 Caminho ajustado: subindo da infra/http para a raiz do shared/http
import { swaggerDocs } from "./openapi/generator";
import routes from "./routes";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";

const app = express();

// --- 🛡️ Middlewares de Base ---
app.use(cors());
app.use(express.json());

// --- 📖 Documentação (Swagger) ---
/**
 * Servido em /api-docs.
 * O Swagger usará o prefixo /api configurado no generator.ts
 */
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- 🚀 Rotas da Aplicação ---
app.use(routes);

// --- ⚠️ Tratamento de Erros Global ---
/**
 * IMPORTANTE: Este middleware deve ser o ÚLTIMO.
 * Ele captura tudo o que foi lançado (throw) nos controllers e use-cases.
 */
app.use(globalErrorHandler);

// --- 📡 Inicialização ---
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("-----------------------------------------------");
  console.log("   🚀 STRATEGIC COND API | BACKEND READY");
  console.log(`   📡 Porta: ${PORT}`);
  console.log(`   🌐 Swagger: http://localhost:${PORT}/api-docs`);
  console.log(`   🛠️  Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log("-----------------------------------------------");
});

export { app };
