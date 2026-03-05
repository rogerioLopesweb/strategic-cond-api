// src_solid/modules/usuarios/use-cases/CadastrarUsuarioUseCase.ts
import { IUsuarioRepository } from "../repositories/IUsuarioRepository";
import { IHashProvider } from "@shared/providers/HashProvider/IHashProvider";
import { IStorageProvider } from "@shared/providers/StorageProvider/models/IStorageProvider";
import { validarEFormatarData } from "@shared/providers/utils/datas";
import { CreateUsuarioDTO } from "../dtos/usuario.dto";
import { AppError } from "@shared/errors/AppError";

export class CadastrarUsuarioUseCase {
  constructor(
    private usuarioRepository: IUsuarioRepository,
    private hashProvider: IHashProvider,
    private storageProvider: IStorageProvider,
  ) {}

  async execute(dados: CreateUsuarioDTO) {
    // 1. Regra de Negócio: Verificar se já existe
    const usuarioExisteCPF = await this.usuarioRepository.findByCpf(dados.cpf);
    if (usuarioExisteCPF) {
      throw new AppError("Este CPF já está cadastrado no sistema.");
    }

    const usuarioExisteEmail = await this.usuarioRepository.findByEmail(
      dados.email,
    );
    if (usuarioExisteEmail) {
      throw new AppError("Este email já está cadastrado no sistema.");
    }

    // 2. Regra de Negócio: Gerar senha provisória (6 primeiros dígitos do CPF)
    const senhaPadrao = dados.cpf.replace(/\D/g, "").substring(0, 6);
    const senhaHash = await this.hashProvider.generateHash(senhaPadrao);

    // 1. Validar e formatar data de nascimento se fornecida
    let dataFormatada = null;
    if (dados.data_nascimento) {
      dataFormatada = validarEFormatarData(dados.data_nascimento);
      if (!dataFormatada) throw new AppError("Data de nascimento inválida.");
    }

    // 3. Persistência Transacional no Banco
    const { usuarioId } = await this.usuarioRepository.cadastrarCompleto(
      dados,
      senhaHash,
      dataFormatada,
    );

    // 4. Lógica de Foto (Opcional)
    let urlFoto = null;
    if (dados.foto_base64) {
      const nomeArquivo = `foto-${usuarioId}-${Date.now()}`;
      const pathRelativo = await this.storageProvider.uploadFoto(
        dados.foto_base64,
        nomeArquivo,
      );

      if (pathRelativo) {
        urlFoto =
          await this.storageProvider.gerarLinkVisualizacao(pathRelativo);
        await this.usuarioRepository.updateFotoUrl(usuarioId, urlFoto);
      }
    }

    return {
      usuario_id: usuarioId,
      senha_provisoria: senhaPadrao,
      url_foto: urlFoto,
    };
  }
}
