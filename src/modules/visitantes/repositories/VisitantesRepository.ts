import { db } from "@shared/infra/database/connection";
import { Visitante } from "../entities/Visitante";
import { Visita } from "../entities/Visita";
import { IVisitantesRepository } from "./IVisitantesRepository";
import { IVisitaDetalhadaDTO } from "../dtos/IVisitaDetalhadaDTO";
import { IVisitasPaginadasDTO } from "../dtos/IVisitasPaginadasDTO";
import { ListVisitasFiltersDTO } from "../dtos/ListVisitasFiltersDTO";

export class VisitantesRepository implements IVisitantesRepository {
  // =================================================================
  // 1. GESTÃO DE PESSOAS (VISITANTES)
  // =================================================================

  async findByCpf(cpf: string): Promise<Visitante | null> {
    // Remove pontuação para buscar limpo (se seu banco salva limpo)
    // const cpfLimpo = cpf.replace(/\D/g, "");

    const query = `SELECT * FROM visitantes WHERE cpf = $1 LIMIT 1`;
    const result = await db.query(query, [cpf]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    // Reconstrói a Entidade
    return new Visitante(
      {
        nome_completo: row.nome_completo,
        cpf: row.cpf,
        rg: row.rg,
        foto_url: row.foto_url,
        tipo_padrao: row.tipo_padrao,
        created_at: row.created_at,
      },
      row.id,
    );
  }

  async createVisitante(visitante: Visitante): Promise<void> {
    const query = `
      INSERT INTO visitantes (id, nome_completo, cpf, rg, foto_url, tipo_padrao, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    await db.query(query, [
      visitante.id,
      visitante.props.nome_completo,
      visitante.props.cpf,
      visitante.props.rg || null,
      visitante.props.foto_url || null,
      visitante.props.tipo_padrao,
      new Date(),
    ]);
  }

  async updateVisitante(visitante: Visitante): Promise<void> {
    const query = `
      UPDATE visitantes 
      SET nome_completo = $1, rg = $2, foto_url = $3, tipo_padrao = $4, updated_at = NOW()
      WHERE id = $5
    `;

    await db.query(query, [
      visitante.props.nome_completo,
      visitante.props.rg || null,
      visitante.props.foto_url || null,
      visitante.props.tipo_padrao,
      visitante.id,
    ]);
  }

  // =================================================================
  // 2. GESTÃO DE ACESSOS (VISITAS)
  // =================================================================

  async registrarEntrada(visita: Visita): Promise<void> {
    const query = `
      INSERT INTO visitas (
        id, 
        condominio_id, 
        visitante_id, 
        unidade_id, 
        autorizado_por_usuario_id, 
        placa_veiculo, 
        observacoes, 
        status, 
        data_entrada
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    await db.query(query, [
      visita.id,
      visita.props.condominio_id,
      visita.props.visitante_id,
      visita.props.unidade_id || null, // Se for na Adm, unidade é null
      visita.props.autorizado_por_id || null,
      visita.props.placa_veiculo || null,
      visita.props.observacoes || null,
      "aberta", // Força o status inicial
      new Date(),
    ]);
  }

  async registrarSaida(visitaId: string, dataSaida: Date): Promise<void> {
    const query = `
      UPDATE visitas 
      SET data_saida = $1, status = 'finalizada'
      WHERE id = $2
    `;
    await db.query(query, [dataSaida, visitaId]);
  }

  /**
   * 3. Listar visitas com filtros cumulativos e segurança Multi-tenant
   */
  async listar(
    filters: ListVisitasFiltersDTO,
    usuarioId?: string,
    perfil?: string,
  ) {
    const {
      condominio_id,
      unidade,
      bloco,
      cpf,
      status,
      page = 1,
      limit = 10,
    } = filters;

    const offset = (page - 1) * limit;
    const values: any[] = [condominio_id];

    // 🔗 Base da Query: Unindo Visitas, Visitantes e Unidades
    let queryBase = `
      FROM visitas v
      INNER JOIN visitantes vis ON v.visitante_id = vis.id
      LEFT JOIN unidades u ON v.unidade_id = u.id
      WHERE v.condominio_id = $1
    `;

    let count = 2;

    // 🛡️ SEGURANÇA: Se for morador, restringe às visitas do apartamento dele
    // ou que ele mesmo autorizou
    if (perfil === "morador" && usuarioId) {
      queryBase += ` AND v.autorizado_por_usuario_id = $${count++}`;
      values.push(usuarioId);
    }

    // 🔍 FILTROS DINÂMICOS DE UNIDADE (Com TRIM e LOWER conforme você pediu)
    if (bloco) {
      queryBase += ` AND LOWER(TRIM(u.bloco)) = LOWER(TRIM($${count++}))`;
      values.push(bloco);
    }

    if (unidade) {
      queryBase += ` AND LOWER(TRIM(u.numero_unidade)) = LOWER(TRIM($${count++}))`;
      values.push(unidade);
    }

    // 🔍 FILTRO DE CPF (Limpando a pontuação caso o front envie formatado)
    if (cpf) {
      const cpfLimpo = cpf.replace(/\D/g, ""); // Deixa só os números
      queryBase += ` AND vis.cpf = $${count++}`;
      values.push(cpfLimpo);
    }

    // 🔍 FILTRO DE STATUS ('aberta', 'finalizada', etc)
    if (status) {
      queryBase += ` AND v.status = $${count++}`;
      values.push(status);
    }

    // 📝 MONTAGEM DAS QUERIES FINAIS
    const dataQuery = `
      SELECT 
        v.id as visita_id,
        v.data_entrada,
        v.data_saida,
        v.status,
        v.placa_veiculo,
        vis.nome_completo as nome_visitante,
        vis.cpf as cpf_visitante,
        vis.foto_url,
        vis.tipo_padrao as tipo,
        u.bloco,
        u.numero_unidade as unidade
      ${queryBase} 
      ORDER BY v.data_entrada DESC 
      LIMIT $${count++} OFFSET $${count++}
    `;

    const totalQuery = `SELECT COUNT(v.id) as total ${queryBase}`;

    // Executa as duas em paralelo para ganhar performance
    const [resData, resTotal] = await Promise.all([
      db.query(dataQuery, [...values, limit, offset]),
      db.query(totalQuery, values),
    ]);

    const totalRecords = parseInt(resTotal.rows[0].total);

    return {
      data: resData.rows,
      pagination: {
        total: totalRecords,
        page,
        limit,
        total_pages: Math.ceil(totalRecords / limit),
      },
    };
  }
}
