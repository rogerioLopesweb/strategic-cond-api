import { Request, Response } from "express";
import { ListarUsuariosUseCase } from "../useCases/ListarUsuariosUseCase";
import { CadastrarUsuarioUseCase } from "../useCases/CadastrarUsuarioUseCase";
import { ObterDetalhesUsuarioUseCase } from "../useCases/ObterDetalhesUsuarioUseCase";
import { AtualizarUsuarioUseCase } from "../useCases/AtualizarUsuarioUseCase";
import { AlterarStatusUsuarioUseCase } from "../useCases/AlterarStatusUsuarioUseCase";
import { SalvarPushTokenUseCase } from "../useCases/SalvarPushTokenUseCase";
import { DeletarUsuarioUseCase } from "../useCases/DeletarUsuarioUseCase";

export class UsuarioController {
  constructor(
    private listarUsuarios: ListarUsuariosUseCase,
    private cadastrarUsuario: CadastrarUsuarioUseCase,
    private obterDetalhes: ObterDetalhesUsuarioUseCase,
    private atualizarUsuario: AtualizarUsuarioUseCase,
    private alterarStatus: AlterarStatusUsuarioUseCase,
    private salvarPushToken: SalvarPushTokenUseCase,
    private deletarUsuario: DeletarUsuarioUseCase,
  ) {}

  async listar(req: Request, res: Response): Promise<Response> {
    const { condominio_id, nome, perfil, bloco, unidade, page, limit } =
      req.query;

    const result = await this.listarUsuarios.execute({
      condominio_id: String(condominio_id),
      nome: nome as string,
      perfil: perfil as string,
      bloco: bloco as string,
      unidade: unidade as string,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });

    return res.json(result);
  }

  async cadastrar(req: Request, res: Response): Promise<Response> {
    const result = await this.cadastrarUsuario.execute(req.body);
    return res.status(201).json(result);
  }

  // Dentro de UsuarioController.ts
  async exibir(req: Request, res: Response): Promise<Response> {
    // Tenta pegar do query (antigo) ou params (novo padrão)
    const id = (req.params.id || req.query.id) as string;
    const condominio_id = (req.params.condominio_id ||
      req.query.condominio_id) as string;

    const result = await this.obterDetalhes.execute(id, condominio_id);
    return res.json(result);
  }

  async atualizar(req: Request, res: Response): Promise<Response> {
    const result = await this.atualizarUsuario.execute(req.body);
    return res.json(result);
  }

  async atualizarStatus(req: Request, res: Response): Promise<Response> {
    const { usuario_id, condominio_id, ativo } = req.body;
    const result = await this.alterarStatus.execute(
      usuario_id,
      String(condominio_id),
      ativo,
    );
    return res.json(result);
  }

  async atualizarToken(req: Request, res: Response): Promise<Response> {
    const { usuario_id, token } = req.body;
    await this.salvarPushToken.execute(usuario_id, token);
    return res.status(204).send();
  }

  async remover(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    await this.deletarUsuario.execute(String(id));
    return res.status(204).send();
  }
}
