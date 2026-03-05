import { z } from "zod";
import { registry } from "../config/openApiRegistry";

/**
 * Schema para geração de QR Code genérico
 */
export const gerarQRCodeSchema = registry.register(
  "GerarQRCodeInput",
  z.object({
    texto: z
      .string()
      .min(1, "O texto para o QR Code é obrigatório.")
      .openapi({
        example: "https://strategiccondo.com/tracking/123",
        description: "Texto ou URL para gerar o QR Code",
      }),
    width: z.coerce
      .number()
      .min(100)
      .max(2000)
      .default(300)
      .openapi({ example: 300, description: "Largura da imagem em pixels" }),
    margin: z.coerce
      .number()
      .min(0)
      .max(10)
      .default(4)
      .openapi({
        example: 4,
        description: "Margem branca ao redor do QR Code",
      }),
  }),
);

// Tipo inferido
export type GerarQRCodeDTO = z.infer<typeof gerarQRCodeSchema>;
