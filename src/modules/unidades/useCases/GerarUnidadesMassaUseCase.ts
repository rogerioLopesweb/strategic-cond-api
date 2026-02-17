import { UnidadeRepository } from "../repositories/UnidadeRepository";
import { GerarUnidadesDTO } from "../schemas/unidadeSchema"; // 🎯 Centralizando no Schema
import { Unidade } from "../entities/Unidade";

export class GerarUnidadesMassaUseCase {
  constructor(private repository: UnidadeRepository) {}

  async execute(dados: GerarUnidadesDTO) {
    const unidadesEntities: Unidade[] = [];

    // 1. Instanciação das Entidades (Onde a limpeza de dados ocorre)
    for (const bloco of dados.blocos) {
      for (let i = dados.inicio; i <= dados.fim; i++) {
        const novaUnidade = new Unidade({
          condominio_id: dados.condominio_id,
          bloco: bloco,
          numero_unidade: i.toString(),
        });

        unidadesEntities.push(novaUnidade);
      }
    }

    // 2. Mapeamento para o formato de matriz que o PostgreSQL UNNEST espera
    const unidadesParaInserir = unidadesEntities.map((u) => [
      u.condominio_id,
      u.bloco, // Aqui já está em UPPERCASE graças à Entity
      u.numero_unidade, // Aqui já está com Trim
    ]);

    // 3. Chamada ao repositório corrigida (Apenas 1 argumento)
    const result = await this.repository.gerarEmMassa(unidadesParaInserir);

    return {
      novas_unidades: result.rowCount || 0,
      total_processado: unidadesEntities.length,
      message:
        result.rowCount === 0
          ? "Todas as unidades já estavam cadastradas."
          : `${result.rowCount} novas unidades geradas com sucesso.`,
    };
  }
}
