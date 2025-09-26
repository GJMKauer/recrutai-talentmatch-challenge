export const readFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve((reader.result as string) ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "utf-8");
  });
};
