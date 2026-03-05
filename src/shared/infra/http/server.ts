import "module-alias/register";
import "reflect-metadata";
import "dotenv/config";
import "express-async-errors";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import path from "path"; // 👈 1. Importar o path

import { swaggerDocs } from "./openapi/generator";
import routes from "./routes";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// --- 📂 Arquivos Estáticos (UPLOAD) ---
/**
 * ✨ CORREÇÃO AQUI:
 * Quando alguém acessar https://sua-api.com/uploads/foto.jpg,
 * o Express vai buscar o arquivo real dentro da pasta /public/uploads
 */
// ✅ 1. Use o caminho absoluto do container (Padrão Easypanel/Docker)
// Isso evita que o erro mude se você estiver rodando em 'src' ou 'dist'
const uploadsPath = "/code/public/uploads";

// ✅ 2. Configure o Static ANTES do app.use(routes)
app.use("/uploads", express.static(uploadsPath));

// --- 📖 Documentação (Swagger) ---
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- 🚀 Rotas da Aplicação ---
app.use(routes);

// --- ⚠️ Tratamento de Erros Global ---
app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("-----------------------------------------------");
  console.log("   🚀 STRATEGIC COND API | BACKEND READY");
  console.log(`   📡 Porta: ${PORT}`);
  console.log(`   📂 Uploads servindo de: ${uploadsPath}`); // 👈 Log para debug
  console.log(`   🌐 Swagger: http://localhost:${PORT}/api-docs`);
  console.log("-----------------------------------------------");
});

export { app };
