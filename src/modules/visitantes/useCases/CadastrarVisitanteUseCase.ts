import { IVisitantesRepository } from "../repositories/IVisitantesRepository";
import { IStorageProvider } from "@shared/providers/StorageProvider/models/IStorageProvider";
import { Visitante } from "../entities/Visitante";
import { AppError } from "@shared/errors/AppError";

export class CadastrarVisitanteUseCase {
  constructor(
    private repository: IVisitantesRepository,
    private storageProvider: IStorageProvider // ✅ Injetado via parâmetro
  ) {}

  async execute(dados: any) {
    const cpfLimpo = dados.cpf.replace(/\D/g, "");

    if (cpfLimpo.length !== 11) {
      throw new AppError("CPF inválido.", 400);
    }

    // 1. Evita duplicidade de cadastro
    const existe = await this.repository.findByCpf(cpfLimpo);
    if (existe) {
      throw new AppError("Visitante já cadastrado com este CPF.", 409);
    }

    // 📸 2. Gerenciamento de Foto (Storage)
    let finalFotoUrl = dados.foto_url;

    if (dados.foto_url) {
      // Move o arquivo da pasta 'tmp' para 'visitantes'
      finalFotoUrl = await this.storageProvider.save(dados.foto_url, "visitantes");
    }

    // 3. Instancia a entidade
    const novoVisitante = new Visitante({
      nome_completo: dados.nome_completo,
      cpf: cpfLimpo,
      rg: dados.rg,
      empresa: dados.empresa,
      foto_url: finalFotoUrl, // ✅ Nome do arquivo final salvo
      tipo_padrao: dados.tipo_padrao || "visitante",
    });

    // 4. Persiste no banco
    return await this.repository.createVisitante(novoVisitante);
  }
}