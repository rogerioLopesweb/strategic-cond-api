// src_solid/modules/usuarios/use-cases/AtualizarUsuarioUseCase.ts
import { IStorageProvider } from "@shared/providers/StorageProvider/models/IStorageProvider";
import { validarEFormatarData } from "@shared/providers/utils/datas";
import { IUsuarioRepository } from "../repositories/IUsuarioRepository";
import { UpdateUsuarioDTO } from "../dtos/usuario.dto";

export class AtualizarUsuarioUseCase {
  constructor(
    private usuarioRepository: IUsuarioRepository,
    private storageProvider: IStorageProvider,
  ) {}

  async execute(dados: UpdateUsuarioDTO) {
    // 1. Validar e formatar data de nascimento se fornecida
    let dataFormatada = null;
    if (dados.data_nascimento) {
      dataFormatada = validarEFormatarData(dados.data_nascimento);
      if (!dataFormatada) throw new Error("Data de nascimento inválida.");
    }

    // 2. Lógica de nova foto (se houver base64 no payload)
    if (dados.foto_base64) {
      const nomeArquivo = `foto-${dados.usuario_id}-${Date.now()}`;
      const path = await this.storageProvider.uploadFoto(
        dados.foto_base64,
        nomeArquivo,
      );

      if (path) {
        const url = await this.storageProvider.gerarLinkVisualizacao(path);
        await this.usuarioRepository.updateFotoUrl(dados.usuario_id, url);
      }
    }

    // 3. Persistir demais alterações no repositório
    await this.usuarioRepository.atualizarCompleto(dados);

    return { success: true };
  }
}
