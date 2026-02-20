// src_solid/modules/usuarios/use-cases/ListarUsuariosUseCase.ts
import { IUsuarioRepository } from "../repositories/IUsuarioRepository";
import { ListUsuarioFilters } from "../dtos/usuario.dto";

export class ListarUsuariosUseCase {
  constructor(private usuarioRepository: IUsuarioRepository) {}

  async execute(filters: ListUsuarioFilters) {
    const { data, total, page, limit } =
      await this.usuarioRepository.listarComFiltros(filters);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }
}
