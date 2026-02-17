import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { IStorageProvider } from "../models/IStorageProvider";

export class S3StorageProvider implements IStorageProvider {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
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
      const finalFileName = `${fileName}.${fileType}`;

      await this.client.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `uploads/${finalFileName}`,
          Body: buffer,
          ContentType: `image/${fileType}`,
          ACL: "public-read", // Opcional: depende da política do seu bucket
        }),
      );

      return `uploads/${finalFileName}`;
    } catch (error) {
      console.error("S3 Upload Error:", error);
      return null;
    }
  }

  async gerarLinkVisualizacao(key: string): Promise<string> {
    // Se estiver usando CloudFront ou URL padrão do S3
    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }
}
