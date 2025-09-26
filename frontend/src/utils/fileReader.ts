/** Lê o conteúdo de um arquivo como texto.
 * @param file - O arquivo a ser lido.
 * @returns Uma Promise que resolve com o conteúdo do arquivo como string.
 * @throws Um erro se a leitura do arquivo falhar.
 */
export const readFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve((reader.result as string) ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "utf-8");
  });
};
