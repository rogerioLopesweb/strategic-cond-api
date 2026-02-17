import { db } from "@shared/infra/database/connection";

export class NotificacaoRepository {
  async buscarPendentes(canal: "push" | "email", limit: number) {
    const query = `
      SELECT n.*, u.expo_push_token, u.email as email_usuario
      FROM notificacoes n
      JOIN usuarios u ON n.usuario_id = u.id
      WHERE n.status = 'pendente' AND n.canal = $1
      LIMIT $2`;
    const res = await db.query(query, [canal, limit]);
    return res.rows;
  }

  async atualizarStatus(
    ids: string[],
    status: "enviado" | "erro",
    erroLog?: string,
  ) {
    await db.query(
      "UPDATE notificacoes SET status = $1, data_envio = NOW(), erro_log = $2 WHERE id = ANY($3)",
      [status, erroLog || null, ids],
    );
  }
}
