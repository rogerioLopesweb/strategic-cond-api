import pool from "../config/db";

interface FiltrosEntrega {
  condominio_id: string;
  unidade?: string;
  bloco?: string;
  status?: string;
  retirada_urgente?: boolean | string;
  pagina?: string;
  limite?: string;
}

interface DadosBaixaManual {
  quem_retirou: string;
  documento_retirou: string;
}

interface DadosAtualizacao {
  condominio_id: string;
  marketplace?: string;
  observacoes?: string | null;
  codigo_rastreio?: string | null;
  retirada_urgente?: boolean;
  tipo_embalagem?: string;
}

export class EntregaService {
  /**
   * Realiza a baixa manual de uma entrega (Portaria)
   */
  async registrarSaidaManual(
    id: string,
    dados: DadosBaixaManual,
    operadorId: string,
  ) {
    const query = `
      UPDATE entregas 
      SET status = 'entregue', 
          data_entrega = NOW(), 
          operador_saida_id = $1,
          quem_retirou = $2, 
          documento_retirou = $3
      WHERE id = $4 AND status = 'recebido' 
      RETURNING *`;

    const result = await pool.query(query, [
      operadorId,
      dados.quem_retirou,
      dados.documento_retirou,
      id,
    ]);

    return result.rows[0] || null;
  }

  /**
   * Realiza a baixa via QR Code (Validado pelo App)
   */
  async registrarSaidaQRCode(id: string, operadorId: string) {
    const idLimpo = id.trim().substring(0, 36); // Sanitização básica UUID

    const query = `
      UPDATE entregas 
      SET status = 'entregue', 
          data_entrega = NOW(), 
          operador_saida_id = $1,
          quem_retirou = 'Portador do QR Code', 
          documento_retirou = 'Validado via App'
      WHERE id = $2 AND status = 'recebido' 
      RETURNING *`;

    const result = await pool.query(query, [operadorId, idLimpo]);
    return result.rows[0] || null;
  }

  /**
   * Atualiza dados de uma entrega (Correção)
   */
  async atualizar(id: string, dados: DadosAtualizacao, operadorId: string) {
    const query = `
      UPDATE entregas 
      SET marketplace = COALESCE($1, marketplace), 
          observacoes = COALESCE($2, observacoes),
          codigo_rastreio = COALESCE($3, codigo_rastreio), 
          retirada_urgente = COALESCE($4, retirada_urgente),
          tipo_embalagem = COALESCE($5, tipo_embalagem), 
          operador_atualizacao_id = $6, 
          data_atualizacao = NOW()
      WHERE id = $7 AND condominio_id = $8 AND status = 'recebido' 
      RETURNING *`;

    const values = [
      dados.marketplace,
      dados.observacoes,
      dados.codigo_rastreio,
      dados.retirada_urgente,
      dados.tipo_embalagem,
      operadorId,
      id,
      dados.condominio_id,
    ];

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Cancela uma entrega (Trilha de auditoria)
   */
  async cancelar(
    id: string,
    motivo: string,
    operadorId: string,
    condominioId: string,
  ) {
    const query = `
      UPDATE entregas 
      SET status = 'cancelada', 
          data_cancelamento = NOW(), 
          operador_cancelamento_id = $1, 
          motivo_cancelamento = $2
      WHERE id = $3 AND condominio_id = $4 AND status = 'recebido' 
      RETURNING *`;

    const result = await pool.query(query, [
      operadorId,
      motivo,
      id,
      condominioId,
    ]);

    return result.rows[0] || null;
  }

  /**
   * Lista entregas com filtros e paginação
   */
  /**
   * Lista entregas com filtros cumulativos e paginação real
   */
  async listar(filters: FiltrosEntrega, usuarioId?: string, perfil?: string) {
    const {
      condominio_id,
      unidade,
      bloco,
      status,
      retirada_urgente = false, // 🎯 Novo filtro capturado
      pagina = "1",
      limite = "10",
    } = filters;

    const offset = (Number(pagina) - 1) * Number(limite);
    const values: any[] = [condominio_id];
    let queryBase = `WHERE e.condominio_id = $1`;
    let count = 2;

    // 🛡️ Filtro de segurança para moradores
    if (perfil === "morador" && usuarioId) {
      queryBase += ` AND e.morador_id = $${count++}`;
      values.push(usuarioId);
    }

    // 🔍 Filtros Cumulativos (AND)
    if (unidade) {
      queryBase += ` AND e.unidade ILIKE $${count++}`;
      values.push(`${unidade}%`);
    }
    if (bloco) {
      queryBase += ` AND e.bloco ILIKE $${count++}`;
      values.push(`${bloco}%`);
    }
    if (status) {
      queryBase += ` AND e.status = $${count++}`;
      values.push(status);
    }

    // 🔥 O Filtro de Urgência (Cumulativo)
    // Tratamos tanto booleano real quanto a string que vem da Query String
    if (retirada_urgente === "true" || retirada_urgente === true) {
      queryBase += ` AND e.retirada_urgente = true`;
    }

    const dadosQuery = `
    SELECT 
      e.*, 
      u.nome_completo AS morador_nome, 
      op_in.nome_completo AS operador_entrada_nome,
      op_out.nome_completo AS operador_saida_nome
    FROM entregas e
    LEFT JOIN usuarios u ON e.morador_id = u.id
    LEFT JOIN usuarios op_in ON e.operador_entrada_id = op_in.id
    LEFT JOIN usuarios op_out ON e.operador_saida_id = op_out.id
    ${queryBase} 
    ORDER BY e.data_recebimento DESC 
    LIMIT $${count++} OFFSET $${count++}`;

    const totalQuery = `SELECT COUNT(*) as total FROM entregas e ${queryBase}`;

    // Executa as duas queries em paralelo para performance
    const [result, totalResult] = await Promise.all([
      pool.query(dadosQuery, [...values, Number(limite), offset]),
      pool.query(totalQuery, values),
    ]);

    const totalRecords = parseInt(totalResult.rows[0].total);
    const total_pages = Math.ceil(totalRecords / Number(limite));

    return {
      success: true,
      // 🔢 Renomeado para 'pagination' para facilitar no Frontend
      pagination: {
        total: totalRecords,
        page: parseInt(pagina as string),
        limit: parseInt(limite as string),
        total_pages: total_pages,
      },
      data: result.rows,
    };
  }
}
