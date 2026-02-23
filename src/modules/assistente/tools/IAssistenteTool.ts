import OpenAI from "openai";

// Dados da sessão que a ferramenta pode precisar para validar regras de negócio
export interface IToolContext {
  condominio_id: string;
  usuario_id: string;
  perfil_usuario: string;
}

export interface IAssistenteTool {
  name: string; // Nome exato da função que a OpenAI vai chamar
  getDefinition(): OpenAI.Chat.Completions.ChatCompletionTool; // O Schema (JSON) da ferramenta
  execute(args: any, context: IToolContext): Promise<string>; // A execução real no banco de dados
}
