import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import swaggerUi from "swagger-ui-express";
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./config/openApiRegistry";
import { errorHandler } from "./middlewares/errorMiddleware";

// Importação das Rotas
import contaRoutes from "./routes/contaRoutes";
import condominioRoutes from "./routes/condominioRoutes";
import authRoutes from "./routes/authRoutes";
import usuarioRoutes from "./routes/usuarioRoutes";
import entregaRoutes from "./routes/entregaRoutes";
import unidadeRoutes from "./routes/unidadeRoutes";
import enviaNotificacaoPushRoutes from "./routes/enviaNotificacaoPushRoutes";
import enviaNotificacaoEmailRoutes from "./routes/enviaNotificacaoEmailRoutes";
import qrCodeRoutes from "./routes/qrCodeRoutes";

const app = express();

// --- Garantir existência da pasta de Uploads (Essencial para Volumes Docker) ---
const uploadDir = path.join(__dirname, "..", "public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`📁 Pasta criada: ${uploadDir}`);
}

// --- Middlewares Globais ---
app.use(cors());

/** * Ajuste de Limite para Fotos Base64
 */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// --- Configuração do Swagger (Zod to OpenAPI) ---

// Registra o esquema de segurança Bearer Auth
registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "Insira o token JWT gerado no login.",
});

const generator = new OpenApiGeneratorV3(registry.definitions);
const swaggerDocs = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "StrategicCond API",
    version: "1.0.0",
    description: "API para gestão de encomendas com armazenamento local na VPS",
  },
  servers: [
    {
      url:
        process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
      description: "Servidor Principal",
    },
  ],
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- Rotas de Arquivos Estáticos ---
// Permite acessar as fotos via: https://sua-api.com/uploads/nome-da-foto.jpg
app.use("/uploads", express.static(uploadDir));

// --- Rotas da API ---
app.use("/api/conta", contaRoutes);
app.use("/api/condominios", condominioRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/entregas", entregaRoutes);
app.use("/api/unidades", unidadeRoutes);
app.use("/api/notificacoes", enviaNotificacaoPushRoutes);
app.use("/api/notificacoes-email", enviaNotificacaoEmailRoutes);
app.use("/api/qrcode", qrCodeRoutes);

// --- Rota de Teste de Saúde (Health Check) ---
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "StrategicCond API Online (Local Storage)",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// --- Tratamento de Erro 404 ---
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Rota não encontrada" });
});

// --- Middleware Global de Erros (Zod & Internos) ---
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
  console.log(`📖 Documentação em /api-docs`);
  console.log(`📸 Servindo arquivos de: ${uploadDir}`);
});
