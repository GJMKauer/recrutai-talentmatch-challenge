/** Extrai o conteúdo JSON de uma string que pode conter texto adicional ou formatação Markdown.
 * Remove quaisquer blocos de código Markdown e extrai o primeiro objeto JSON encontrado.
 * @param text - A string de entrada que pode conter JSON.
 * @returns A string contendo apenas o conteúdo JSON extraído.
 */
export const extractJson = (text: string) => {
  let t = text
    .trim()
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) t = t.slice(start, end + 1);

  return t;
};
