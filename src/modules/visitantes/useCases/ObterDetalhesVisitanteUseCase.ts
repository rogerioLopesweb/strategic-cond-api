import { IVisitantesRepository } from "../repositories/IVisitantesRepository";
import { AppError } from "@shared/errors/AppError";

/**
 * ObterDetalhesVisitanteUseCase: Consolida o dossiê completo para as 3 abas do modal:
 * 1. Dados Cadastrais (CRM)
 * 2. Histórico de Acessos (Timeline)
 * 3. Histórico de Segurança (Restrições 1:N)
 */
export class ObterDetalhesVisitanteUseCase {
  constructor(private repository: IVisitantesRepository) {}

  async execute(visitanteId: string, condominioId: string) {
    
    // 🛡️ 1. Busca o perfil mestre (CRM) com trava de condomínio
    // Isso garante que um porteiro não acesse detalhes de um visitante de outro prédio
    const visitante = await this.repository.findById(visitanteId, condominioId);
    
    if (!visitante) {
      throw new AppError("Visitante não encontrado ou acesso não autorizado.", 404);
    }

    // 🎯 2. Busca paralela de alto desempenho
    // Buscamos os logs de movimentação e de segurança ao mesmo tempo
    const [acessos, restricoesHistorico, restricaoAtiva] = await Promise.all([
      this.repository.listarHistoricoPorVisitante(visitanteId, condominioId),
      this.repository.listarRestricoes(visitanteId, condominioId),
      this.repository.verificarRestricaoAtiva(visitanteId, condominioId)
    ]);

    // 3. Retorno estruturado para as ABAS do Frontend
    return {
      // ✅ ABA 1: PERFIL (Dados Cadastrais)
      visitante: {
        id: visitante.id,
        nome_completo: visitante.nome,
        cpf: visitante.cpf,
        rg: visitante.props.rg,
        foto_url: visitante.props.foto_url,
        tipo: visitante.tipo,
        empresa: visitante.empresa,
        data_cadastro: visitante.props.data_cadastro
      },

      // ✅ ABA 2: HISTÓRICO (Timeline de Entradas/Saídas)
      // Mapeamos para garantir que a lista de acessos esteja pronta para o FlatList
      historico_acessos: acessos.map(acesso => ({
        id: acesso.id,
        data_entrada: acesso.data_entrada,
        data_saida: acesso.data_saida,
        status: acesso.status,
        unidade: acesso.unidade ? `Bloco ${acesso.bloco} - ${acesso.unidade}` : "ADM",
        operador: acesso.registrado_por
      })),

      // ✅ ABA 3: SEGURANÇA (Dossiê de Bloqueios/Desbloqueios)
      historico_restricoes: restricoesHistorico,

      // 🚨 STATUS DE SEGURANÇA (Alertas do Cabeçalho)
      seguranca: {
        bloqueado: !!restricaoAtiva,
        dados_restricao: restricaoAtiva ? {
          id: restricaoAtiva.id,
          tipo: restricaoAtiva.tipo_restricao,
          mensagem: restricaoAtiva.descricao,
          instrucao: restricaoAtiva.instrucao_portaria,
          data: restricaoAtiva.data_cadastro,
          operador: restricaoAtiva.operador_nome
        } : null
      }
    };
  }
}