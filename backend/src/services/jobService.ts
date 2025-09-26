import { promises as fs } from "fs";
import path from "path";
import { JobSchema, type Job } from "../models/job.js";

let cachedJob: Job | null = null;

/** Obtém o caminho absoluto para o arquivo de descrição de vaga padrão. */
const getJobFilePath = (): string => {
  return path.resolve(process.cwd(), "..", "mocks", "jobs", "jobdesc_eng_fullstack.json");
};

/** Carrega e retorna a descrição de vaga padrão.
 * Utiliza cache para evitar leituras repetidas do arquivo.
 * @returns A descrição da vaga padrão.
 * @throws Um erro se a leitura do arquivo ou a validação falhar.
 */
export const getDefaultJob = async (): Promise<Job> => {
  if (cachedJob) {
    return cachedJob;
  }

  const filePath = getJobFilePath();
  const contents = await fs.readFile(filePath, "utf-8");
  const parsed = JSON.parse(contents);
  const job = JobSchema.parse(parsed);

  cachedJob = job;
  return job;
};

/** Limpa o cache da descrição de vaga padrão. */
export const clearJobCache = (): void => {
  cachedJob = null;
};
