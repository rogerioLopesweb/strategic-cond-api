import { BCryptHashProvider } from "@shared/providers/HashProvider/BCryptHashProvider";
import { DiskStorageProvider } from "@shared/providers/StorageProvider/implementations/DiskStorageProvider";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { UsuarioController } from "../controllers/UsuarioController";
import { ListarUsuariosUseCase } from "../useCases/ListarUsuariosUseCase";
import { CadastrarUsuarioUseCase } from "../useCases/CadastrarUsuarioUseCase";
import { ObterDetalhesUsuarioUseCase } from "../useCases/ObterDetalhesUsuarioUseCase";
import { AtualizarUsuarioUseCase } from "../useCases/AtualizarUsuarioUseCase";
import { AlterarStatusUsuarioUseCase } from "../useCases/AlterarStatusUsuarioUseCase";
import { SalvarPushTokenUseCase } from "../useCases/SalvarPushTokenUseCase";
import { DeletarUsuarioUseCase } from "../useCases/DeletarUsuarioUseCase";

export const makeUsuarioController = (): UsuarioController => {
  const repository = new UsuarioRepository();
  const hashProvider = new BCryptHashProvider();
  const storageProvider = new DiskStorageProvider();

  return new UsuarioController(
    new ListarUsuariosUseCase(repository),
    new CadastrarUsuarioUseCase(repository, hashProvider, storageProvider),
    new ObterDetalhesUsuarioUseCase(repository),
    new AtualizarUsuarioUseCase(repository, storageProvider),
    new AlterarStatusUsuarioUseCase(repository),
    new SalvarPushTokenUseCase(repository),
    new DeletarUsuarioUseCase(repository),
  );
};
