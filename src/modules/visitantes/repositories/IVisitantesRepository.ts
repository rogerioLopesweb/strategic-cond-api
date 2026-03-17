import { Visitante } from "../entities/Visitante";
import { VisitanteAcessos } from "../entities/VisitanteAcessos";
import { IFiltersListVisitanteAcessosDTO } from "../dtos/IFiltersListVisitanteAcessosDTO";
import { IFiltersVisitantesDTO } from "../dtos/IFiltersVisitantesDTO";

export interface IVisitantesRepository {
  
  // =================================================================
  // 1. GESTÃO DE PESSOAS (CRM / VISITANTES)
  // =================================================================
  
  /** 🎯 Busca perfil pelo ID validando o contexto do condomínio */
  findById(id: string, condominio_id: string): Promise<Visitante | null>;
  
  /** 🎯 Busca perfil pelo CPF dentro do condomínio para o Check-in */
  findByCpf(cpf: string, condominio_id: string): Promise<Visitante | null>;
  
  /** Listagem Global Paginada para a tela de "Base de Visitantes" */
  listarVisitantes(filters: IFiltersVisitantesDTO): Promise<{ data: any[]; total: number }>;

  /** Persistência inicial de um novo perfil (Já deve conter condominio_id na entidade) */
  createVisitante(visitante: Visitante): Promise<Visitante>;

  /** Atualização de dados cadastrais (Auditado e protegido por contexto) */
  updateVisitante(visitante: Visitante, operadorId: string): Promise<void>;

  /** Exclusão lógica (Soft Delete) do perfil do visitante protegida por contexto */
  delete(id: string, operadorId: string, condominio_id: string): Promise<void>;


  // =================================================================
  // 2. GESTÃO DE SEGURANÇA (RESTRIÇÕES 1:N)
  // =================================================================

  /** 🎯 Verifica se há alguma restrição ATIVA (ativo = true) para o Alerta Vermelho */
  verificarRestricaoAtiva(visitanteId: string, condominioId: string): Promise<any | null>;

  /** Listagem de todas as restrições (Aba "RESTRIÇÕES" do Modal) */
  listarRestricoes(visitanteId: string, condominioId: string): Promise<any[]>;

  /** Cria um novo registro de restrição no histórico */
  registrarRestricao(dados: {
    visitante_id: string;
    condominio_id: string;
    tipo_restricao: string;
    descricao: string;
    instrucao_portaria: string;
    operador_cadastro_id: string;
  }): Promise<void>;

  /** ✍️ Atualiza os dados de uma restrição existente (Auditado) */
  updateRestricao(id: string, condominioId: string, dados: {
    tipo_restricao: string;
    descricao: string;
    instrucao_portaria: string;
    operador_id: string;
  }): Promise<void>;

  /** 🔌 Desativa uma restrição (Status: Resolvido) com trava de segurança */
  cancelarRestricao(id: string, operadorId: string, condominioId: string): Promise<void>;

  /** 🗑️ Exclusão lógica (Soft Delete) de uma restrição do histórico */
  excluirRestricao(id: string, operadorId: string, condominioId: string): Promise<void>;


  // =================================================================
  // 3. GESTÃO DE MOVIMENTAÇÃO (VISITAS / ACESSOS)
  // =================================================================

  /** Registra o check-in físico */
  registrarEntrada(visita: VisitanteAcessos, operadorId: string): Promise<VisitanteAcessos>;

  /** Registra o check-out validando o condomínio */
  registrarSaida(visitaId: string, operadorId: string, condominioId: string): Promise<void>;

  /** Listagem das últimas entradas para a Aba "ACESSOS" do Modal */
  listarHistoricoPorVisitante(visitanteId: string, condominioId: string): Promise<any[]>;

  /** Listagem geral da timeline da portaria (Filtros avançados) */
  listarAcessos(filters: IFiltersListVisitanteAcessosDTO): Promise<{ data: any[]; pagination: any }>;
}