import fs from "fs";
import path from "path";
import { IStorageProvider } from "../models/IStorageProvider";

export class DiskStorageProvider implements IStorageProvider {
  private uploadPath = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "..",
    "public",
    "uploads",
  );

  constructor() {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async uploadFoto(
    base64Data: string,
    fileName: string,
  ): Promise<string | null> {
    try {
      const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) return null;

      const fileType = matches[1];
      const buffer = Buffer.from(matches[2], "base64");
      const nomeArquivoFinal = `${fileName}.${fileType}`;

      fs.writeFileSync(path.join(this.uploadPath, nomeArquivoFinal), buffer);

      return `/uploads/${nomeArquivoFinal}`;
    } catch (error) {
      return null;
    }
  }

  async gerarLinkVisualizacao(key: string): Promise<string> {
    return `${process.env.BASE_URL}${key}`;
  }
}
