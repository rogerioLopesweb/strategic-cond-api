import { Request, Response } from "express";
import { ListarUnidadesUseCase } from "../useCases/ListarUnidadesUseCase";
import { GerarUnidadesMassaUseCase } from "../useCases/GerarUnidadesMassaUseCase";
import { VincularMoradorUseCase } from "../useCases/VincularMoradorUseCase";
import { VincularMoradorPorTextoUseCase } from "../useCases/VincularMoradorPorTextoUseCase"; // 🔥 Adicionado
import { BuscarMoradoresUseCase } from "../useCases/BuscarMoradoresUseCase";
import { AtualizarStatusVinculoUseCase } from "../useCases/AtualizarStatusVinculoUseCase";

export class UnidadeController {
  constructor(
    private listarUnidadesUseCase: ListarUnidadesUseCase,
    private gerarMassaUseCase: GerarUnidadesMassaUseCase,
    private vincularMoradorUseCase: VincularMoradorUseCase,
    private vincularPorTextoUseCase: VincularMoradorPorTextoUseCase, // 🔥 Injetado
    private buscarMoradoresUseCase: BuscarMoradoresUseCase,
    private atualizarStatusUseCase: AtualizarStatusVinculoUseCase,
  ) {}

  public async index(req: Request, res: Response) {
    const filters = req.query as any;
    const result = await this.listarUnidadesUseCase.execute(filters);
    return res.json({ success: true, ...result });
  }

  public async storeMassa(req: Request, res: Response) {
    const result = await this.gerarMassaUseCase.execute(req.body);
    return res.json({ success: true, ...result });
  }

  // Vínculo por ID (UUID)
  public async vincular(req: Request, res: Response) {
    await this.vincularMoradorUseCase.execute(req.body);
    return res.json({
      success: true,
      message: "Morador vinculado com sucesso!",
    });
  }

  /**
   * 🔥 NOVO: Vincular Morador por Texto (Bloco e Número)
   * Resolve o endpoint /vincular-morador-bloco
   */
  public async vincularPorTexto(req: Request, res: Response) {
    await this.vincularPorTextoUseCase.execute(req.body);
    return res.json({
      success: true,
      message: "Vínculo patrimonial criado com sucesso!",
    });
  }

  public async listarMoradores(req: Request, res: Response) {
    const filters = req.query as any;
    const moradores = await this.buscarMoradoresUseCase.execute(filters);
    return res.json({ success: true, data: moradores });
  }

  public async updateStatus(req: Request, res: Response) {
    // 🎯 Capturamos o retorno do Use Case para usar a mensagem dinâmica
    // (ex: "Morador reativado" ou "Saída registrada")
    const result = await this.atualizarStatusUseCase.execute(req.body);
    return res.json({
      success: true,
      message: result.message,
    });
  }
}
