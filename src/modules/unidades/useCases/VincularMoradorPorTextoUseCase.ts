import { AppError } from "@shared/errors/AppError";
import { UnidadeRepository } from "../repositories/UnidadeRepository";
import { VincularMoradorPorTextoDTO } from "../schemas/unidadeSchema";

export class VincularMoradorPorTextoUseCase {
  constructor(private repository: UnidadeRepository) {}

  async execute(dados: VincularMoradorPorTextoDTO): Promise<void> {
    // 1. Tradução: Busca o UUID da unidade através do Bloco e Número
    // Usamos o método que criamos no Repositório que já faz o UPPERCASE
    const unidade = await this.repository.buscarUnidadePorTexto(
      dados.condominio_id,
      dados.identificador_bloco,
      dados.numero,
    );

    // 🛡️ Regra de Negócio: Se o texto digitado não bater com nenhuma unidade...
    if (!unidade) {
      throw new AppError(
        `Unidade não encontrada: Bloco ${dados.identificador_bloco}, N° ${dados.numero}. Verifique os dados ou cadastre a unidade primeiro.`,
        404,
      );
    }

    /**
     * 🚀 Reuso de Lógica:
     * Como o processo de salvar no banco (transação) é idêntico ao vínculo por ID,
     * reaproveitamos o método 'vincularMorador' do repositório,
     * injetando o 'unidade_id' que acabamos de descobrir.
     */
    await this.repository.vincularMorador({
      usuario_id: dados.usuario_id,
      condominio_id: dados.condominio_id,
      unidade_id: unidade.id, // O ID que encontramos via texto
      tipo_vinculo: dados.tipo_vinculo,
    });
  }
}
