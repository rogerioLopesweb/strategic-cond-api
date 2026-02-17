// src_solid/modules/usuarios/use-cases/ListarUsuariosUseCase.ts
import { IUsuarioRepository } from "../repositories/IUsuarioRepository";
import { ListUsuarioFilters } from "../dtos/usuario.dto";

export class ListarUsuariosUseCase {
  constructor(private usuarioRepository: IUsuarioRepository) {}

  async execute(filters: ListUsuarioFilters) {
    const { data, total } =
      await this.usuarioRepository.listarComFiltros(filters);

    const totalPages = Math.ceil(total / filters.limit);

    return {
      success: true,
      meta: {
        total,
        pagina: Number(filters.page),
        limite: Number(filters.limit),
        total_pages: totalPages,
      },
      data,
    };
  }
}
