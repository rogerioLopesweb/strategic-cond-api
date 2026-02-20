import { IVisitantesRepository } from "../repositories/IVisitantesRepository";
import { Visitante } from "../entities/Visitante";
import { Visita } from "../entities/Visita";
import { AppError } from "@shared/errors/AppError"; // Ajuste o import conforme seu projeto

// Interface de entrada combinada (Dados Pessoa + Dados Visita)
interface IEntradaRequest {
  // Dados do Visitante
  nome_completo: string;
  cpf: string;
  rg?: string;
  foto_url?: string;
  tipo_padrao: "visitante" | "prestador" | "corretor";

  // Dados da Visita
  condominio_id: string;
  unidade_id?: string; // Opcional (pode ser visita à ADM)
  autorizado_por_id?: string; // ID do usuário que autorizou
  placa_veiculo?: string;
  observacoes?: string;
}

export class RegistrarEntradaUseCase {
  constructor(private visitantesRepository: IVisitantesRepository) {}

  async execute(dados: IEntradaRequest) {
    // 1. Verificar se o Visitante já existe (Busca pelo CPF)
    let visitante = await this.visitantesRepository.findByCpf(dados.cpf);

    if (!visitante) {
      // --- A: Não existe -> Cria novo ---
      visitante = new Visitante({
        nome_completo: dados.nome_completo,
        cpf: dados.cpf,
        rg: dados.rg,
        foto_url: dados.foto_url,
        tipo_padrao: dados.tipo_padrao,
      });

      await this.visitantesRepository.createVisitante(visitante);
    } else {
      // --- B: Já existe -> Atualiza dados (ex: mudou corte de cabelo/foto, ou RG) ---
      // Aqui você pode decidir se atualiza sempre ou só se vier dados novos.
      // Vamos atualizar para manter o cadastro fresco.

      // Nota: Não alteramos o CPF aqui, pois é a chave de busca.
      // Recriamos a entidade com o mesmo ID para o update
      const visitanteAtualizado = new Visitante(
        {
          nome_completo: dados.nome_completo,
          cpf: dados.cpf,
          rg: dados.rg || visitante.props.rg,
          foto_url: dados.foto_url || visitante.props.foto_url,
          tipo_padrao: dados.tipo_padrao,
          created_at: visitante.props.created_at, // Mantém data original
        },
        visitante.id,
      );

      await this.visitantesRepository.updateVisitante(visitanteAtualizado);
      visitante = visitanteAtualizado;
    }

    // 2. Criar a Entidade Visita (O evento de entrada)
    const visita = new Visita({
      condominio_id: dados.condominio_id,
      visitante_id: visitante.id, // ID garantido do passo anterior
      unidade_id: dados.unidade_id,
      autorizado_por_id: dados.autorizado_por_id,
      placa_veiculo: dados.placa_veiculo,
      observacoes: dados.observacoes,
    });

    // 3. Persistir a Entrada
    await this.visitantesRepository.registrarEntrada(visita);

    return visita;
  }
}
