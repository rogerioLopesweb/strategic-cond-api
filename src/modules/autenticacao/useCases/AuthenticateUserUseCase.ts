import { IUsuarioRepository } from "@modules/usuarios/repositories/IUsuarioRepository";
import { IHashProvider } from "@shared/providers/HashProvider/IHashProvider";
import { ITokenProvider } from "@shared/providers/TokenProvider/ITokenProvider";
import { AppError } from "@shared/errors/AppError";
import { ContasFactory } from "@modules/contas/factories/ContaFactory";
import {
  IAuthenticateUserRequestDTO,
  IAuthenticateUserResponseDTO,
} from "../dtos/IAuthenticateUserDTO";
import { CondominiosFactory } from "@modules/condominios/factories/CondominioFactory";
import { Usuario } from "@modules/usuarios/entities/Usuario"; // Ajuste o import conforme sua estrutura

export class AuthenticateUserUseCase {
  constructor(
    private usuarioRepository: IUsuarioRepository,
    private hashProvider: IHashProvider,
    private tokenProvider: ITokenProvider,
  ) {}

  async execute({
    login,
    senha,
  }: IAuthenticateUserRequestDTO): Promise<IAuthenticateUserResponseDTO> {
    // 1. Busca Usuário
    const usuario = await this.usuarioRepository.findByLogin(login);
    if (!usuario?.props)
      throw new AppError("Usuário não encontrado: " + login, 401);

    // 2. Valida Senha
    const passwordMatched = await this.hashProvider.compareHash(
      senha,
      usuario.props.senha_hash,
    );
    if (!passwordMatched) throw new AppError("Senha inválida", 401);

    // ---------------------------------------------------------
    // 3. 🔍 BUSCA DADOS EXTRAS (Preenchendo as lacunas)
    // ---------------------------------------------------------

    // Busca se é Master (Dono de conta)
    // 3. Busca se é Master (Usando a Factory do módulo de Contas)
    const findContaMaster = ContasFactory.makeFindContaMaster();
    const conta_id = await findContaMaster.execute(usuario["_id"]);

    const isMaster = !!conta_id; // Transforma string em boolean (se tiver ID é true)

    // ✅ Código Novo (Desacoplado via Factory)
    const listarCondominiosAuth = CondominiosFactory.makeListarAuth();
    const condominios = await listarCondominiosAuth.execute(usuario.id);

    // 4. Lógica de Bloqueio (Igual ao legado)
    if (!isMaster && condominios.length === 0) {
      throw new AppError("Usuário sem vínculos ativos ou conta pendente.", 403);
    }

    // 5. Gera Token (Incluindo os dados extras no payload se necessário)
    const token = this.tokenProvider.generateToken({
      id: usuario.id,
      isMaster,
      conta_id,
      perfil: condominios.length > 0 ? condominios[0].perfil : null, // Pega o primeiro perfil ou null
    });

    // 6. ✅ Retorno Preenchido
    // 6. ✅ Retorno Preenchido (Token movido para dentro)
    return {
      usuario: {
        id: usuario.id,
        nome: usuario.props.nome_completo,
        email: usuario.props.email,
        cpf: usuario.props.cpf,

        // As variáveis calculadas:
        isMaster: isMaster,
        conta_id: conta_id,
        token: token, // 🎯 AQUI: O token deve estar DENTRO de usuario

        condominios: condominios.map((c) => ({
          id: c.id,
          nome_fantasia: c.nome_fantasia,
          perfil: c.perfil,
        })),
      },
      // token, // ❌ Remova daqui
    };
  }
}
