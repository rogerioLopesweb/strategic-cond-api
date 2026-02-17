import { UsuarioRepository } from "@modules/usuarios/repositories/UsuarioRepository";
import { BCryptHashProvider } from "@shared/providers/HashProvider/BCryptHashProvider"; // Ajuste o caminho
import { JsonWebTokenProvider } from "@shared/providers/TokenProvider/implementations/JsonWebTokenProvider"; // Ajuste o caminho
import { AuthenticateUserUseCase } from "../useCases/AuthenticateUserUseCase";
import { GetProfileUseCase } from "../useCases/GetProfileUseCase";

export class AuthFactory {
  static makeAuthenticateUser(): AuthenticateUserUseCase {
    const usuariosRepository = new UsuarioRepository();
    const hashProvider = new BCryptHashProvider();
    const tokenProvider = new JsonWebTokenProvider();

    return new AuthenticateUserUseCase(
      usuariosRepository,
      hashProvider,
      tokenProvider,
    );
  }

  static makeGetProfile(): GetProfileUseCase {
    const usuariosRepository = new UsuarioRepository();
    return new GetProfileUseCase(usuariosRepository);
  }
}
