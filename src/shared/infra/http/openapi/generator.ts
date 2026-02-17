import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./registry";

// 🎯 O SEGREDO: Importe o arquivo onde as rotas são registradas.
// Isso faz o código de 'registry.registerPath' ser executado.
import "../../http/routes";

export const generator = new OpenApiGeneratorV3(registry.definitions);

export const swaggerDocs = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "StrategicCond API",
    version: "1.0.0",
    description: "API para gestão de encomendas com armazenamento local na VPS",
  },
  servers: [
    {
      url: `${process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`}`,
      description: "Servidor Principal (com prefixo /api)",
    },
  ],
});
