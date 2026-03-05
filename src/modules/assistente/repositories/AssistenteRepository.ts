import { db } from "@shared/infra/database/connection";
import { Mensagem, RoleMensagem } from "../entities/Mensagem";
import { SessaoChat, StatusSessao } from "../entities/SessaoChat";
import { IAssistenteRepository } from "./IAssistenteRepository";

export class AssistenteRepository implements IAssistenteRepository {
  // =================================================================
  // 1. GERENCIAMENTO DA SESSÃO (A Sala de Chat)
  // =================================================================

  async buscarSessaoAtiva(
    usuario_id: string,
    condominio_id: string,
  ): Promise<SessaoChat | null> {
    const query = `
      SELECT * FROM sessao_chat 
      WHERE usuario_id = $1 
        AND condominio_id = $2 
        AND status = 'ATIVA' 
      LIMIT 1
    `;
    const result = await db.query(query, [usuario_id, condominio_id]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];

    // Reconstrói a Entidade
    return new SessaoChat(
      {
        condominio_id: row.condominio_id,
        usuario_id: row.usuario_id,
        status: row.status as StatusSessao,
        created_at: row.criado_em,
        updated_at: row.atualizado_em,
      },
      row.id,
    );
  }

  async criarSessao(sessao: SessaoChat): Promise<void> {
    const query = `
      INSERT INTO sessao_chat (id, condominio_id, usuario_id, status, criado_em, atualizado_em)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await db.query(query, [
      sessao.id,
      sessao.props.condominio_id,
      sessao.props.usuario_id,
      sessao.props.status,
      sessao.props.created_at,
      sessao.props.updated_at,
    ]);
  }

  async atualizarSessao(sessao: SessaoChat): Promise<void> {
    const query = `
      UPDATE sessao_chat 
      SET status = $1, atualizado_em = $2
      WHERE id = $3
    `;

    await db.query(query, [
      sessao.props.status,
      sessao.props.updated_at,
      sessao.id,
    ]);
  }

  // =================================================================
  // 2. GERENCIAMENTO DO HISTÓRICO (Mensagens)
  // =================================================================

  async salvarMensagem(mensagem: Mensagem): Promise<void> {
    const query = `
      INSERT INTO mensagem_chat (id, sessao_id, role, conteudo, tokens_usados, criado_em)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await db.query(query, [
      mensagem.id,
      mensagem.props.sessao_id,
      mensagem.props.role,
      mensagem.props.texto, // Mapeando a prop 'texto' para a coluna 'conteudo'
      mensagem.props.tokens_usados || 0,
      mensagem.props.created_at,
    ]);
  }

  async buscarHistoricoPorSessao(
    sessao_id: string,
    limite?: number,
  ): Promise<Mensagem[]> {
    let query = `
      SELECT * FROM mensagem_chat 
      WHERE sessao_id = $1 
      ORDER BY criado_em ASC
    `;
    const values: any[] = [sessao_id];

    // Se o UseCase pedir limite (ex: as últimas 10), adicionamos na query dinamicamente
    if (limite) {
      // Como a ordem é ASC (da mais antiga para a mais nova),
      // precisamos de uma subquery para pegar as ÚLTIMAS X e depois ordenar direito.
      query = `
        SELECT * FROM (
          SELECT * FROM mensagem_chat 
          WHERE sessao_id = $1 
          ORDER BY criado_em DESC 
          LIMIT $2
        ) sub
        ORDER BY sub.criado_em ASC
      `;
      values.push(limite);
    }

    const result = await db.query(query, values);

    // Mapeia as linhas do banco de volta para a Entidade de Domínio
    return result.rows.map(
      (row: any) =>
        new Mensagem(
          {
            sessao_id: row.sessao_id,
            role: row.role as RoleMensagem,
            texto: row.conteudo, // Mapeando coluna 'conteudo' para prop 'texto'
            tokens_usados: row.tokens_usados,
            created_at: row.criado_em,
          },
          row.id,
        ),
    );
  }
}
