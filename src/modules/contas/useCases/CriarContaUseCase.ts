// src_solid/modules/contas/use-cases/CriarContaUseCase.ts
import { IContaRepository } from "../repositories/IContaRepository";
import { CreateContaDTO } from "../dtos/conta.dto";

export class CriarContaUseCase {
  constructor(private contaRepository: IContaRepository) {}

  async execute(dados: CreateContaDTO, donoId: string) {
    // Aqui poderiam entrar regras como: "Máximo de 5 contas por CPF"
    return await this.contaRepository.criar(dados, donoId);
  }
}
