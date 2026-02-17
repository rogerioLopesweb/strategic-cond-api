export interface IStorageProvider {
  uploadFoto(base64Data: string, fileName: string): Promise<string | null>;
  gerarLinkVisualizacao(key: string): Promise<string>;
}
