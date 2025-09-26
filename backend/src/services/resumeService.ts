import { promises as fs } from "fs";
import path from "path";

interface PresetResume {
  filename: string;
  id: string;
  label: string;
  markdown: string;
}

let cachedResumes: Array<PresetResume> | null = null;

/** Obtém o caminho absoluto para o diretório que contém os currículos predefinidos. */
const getResumeDirectory = (): string => {
  return path.resolve(process.cwd(), "..", "mocks", "cvs");
};

/** Carrega e retorna todos os currículos predefinidos do diretório.
 * Utiliza cache para evitar leituras repetidas do diretório.
 * @returns Um array de currículos predefinidos.
 * @throws Um erro se a leitura do diretório ou dos arquivos falhar.
 */
const loadResumes = async (): Promise<Array<PresetResume>> => {
  if (cachedResumes) {
    return cachedResumes;
  }

  const directory = getResumeDirectory();
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const resumes: Array<PresetResume> = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }

    const filePath = path.join(directory, entry.name);
    const markdown = await fs.readFile(filePath, "utf-8");
    const id = entry.name.replace(/\.md$/, "");
    const label = entry.name
      .replace(/candidate_cv_/i, "")
      .replace(/_/g, " ")
      .replace(/\.md$/, "")
      .replace(/\b\w/g, (match) => match.toUpperCase());

    resumes.push({ filename: entry.name, id, label, markdown });
  }

  cachedResumes = resumes;
  return resumes;
};

/** Recupera todos os currículos predefinidos.
 * @returns Um array de currículos predefinidos.
 * @throws Um erro se a leitura dos arquivos falhar.
 */
export const getPresetResumes = async (): Promise<Array<PresetResume>> => {
  const resumes = await loadResumes();
  return resumes.map((resume) => ({ ...resume }));
};

/** Recupera um currículo predefinido pelo ID. */
export const getPresetResume = async (id: string): Promise<PresetResume | null> => {
  const resumes = await loadResumes();
  return resumes.find((resume) => resume.id === id) ?? null;
};
