/**
 * Valida e formata uma string de data de DD/MM/YYYY para YYYY-MM-DD.
 * Retorna null se a data for inválida.
 */
export const validarEFormatarData = (
  dataStr: string | null | undefined,
): string | null => {
  if (!dataStr) return null;

  // Regex para validar o formato básico DD/MM/YYYY
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;

  const match = dataStr.match(regex);
  if (!match) return null;

  // 🛡️ REMOVIDO O '_': Deixamos apenas a vírgula para pular o primeiro índice (full match)
  const [, dia, mes, ano] = match;

  const diaNum = parseInt(dia);
  const mesNum = parseInt(mes);
  const anoNum = parseInt(ano);

  // Criamos o objeto Date (Mês no JS começa em 0)
  const dataTeste = new Date(anoNum, mesNum - 1, diaNum);

  // Verifica se a data é real (ex: impede 31/02/2024)
  const dataValida =
    dataTeste.getFullYear() === anoNum &&
    dataTeste.getMonth() + 1 === mesNum &&
    dataTeste.getDate() === diaNum;

  return dataValida
    ? `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`
    : null;
};
