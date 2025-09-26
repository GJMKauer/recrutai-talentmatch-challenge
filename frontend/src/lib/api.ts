export type PresetResume = {
  filename: string;
  id: string;
  label: string;
  markdown: string;
};

export type Job = {
  company?: { name?: string };
  description?: string;
  id: string;
  keywords?: Array<string>;
  location?: { city?: string; country?: string; state?: string; type?: string };
  requirements?: {
    desirable?: Array<{ category: string; items: Array<string | { language: string; level: string }> }>;
    mandatory?: Array<{ category: string; items: Array<string | { language: string; level: string }> }>;
  };
  responsibilities?: Array<string>;
  seniority_level?: string;
  title?: string;
  years_of_experience?: { max?: number; min?: number };
};

export type MatchSummary = {
  analysisSource: "fallback" | "openai";
  candidateId: string;
  createdAt: string;
  id: string;
  jobId: string;
  overallScore: number;
};

export type MatchResult = MatchSummary & {
  gaps: Array<string>;
  insights: string;
  job: Job;
  matchedSkills: Array<string>;
  missingSkills: Array<string>;
  resumeMarkdown: string;
  strengths: Array<string>;
  suggestedQuestions?: Array<string>;
};

export type MatchRequest = {
  candidate?: {
    id?: string;
    name?: string;
  };
  job: unknown;
  resumeMarkdown: string;
  source?: "manual" | "preset" | "upload";
};

/** Manipula a resposta da API, lançando um erro se a resposta não for OK.
 * @param response - A resposta da API a ser manipulada.
 * @returns O conteúdo JSON da resposta se for bem-sucedida.
 * @throws Um erro com a mensagem apropriada se a resposta não for OK.
 */
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new Error(message);
  }

  return (await response.json()) as T;
};

/** Extrai a mensagem de erro de uma resposta da API.
 * Tenta analisar o corpo da resposta como JSON e extrair a mensagem.
 * Se falhar, retorna o status text ou uma mensagem padrão.
 * @param response - A resposta da API da qual extrair a mensagem de erro.
 * @returns A mensagem de erro extraída ou uma mensagem padrão.
 */
const extractErrorMessage = async (response: Response): Promise<string> => {
  const payload = await response.json();
  if (payload?.message) {
    return payload.message;
  }

  return response.statusText || "Unexpected API error";
};

/** Recupera a lista de currículos predefinidos do backend.
 * @param signal - Um sinal de aborto opcional para cancelar a requisição.
 * @returns Um array de currículos predefinidos.
 * @throws Um erro se a requisição falhar ou a resposta não for OK.
 */
export const fetchPresetResumes = async (signal?: AbortSignal): Promise<Array<PresetResume>> => {
  const response = await fetch(`/api/presets/resumes`, { signal });

  return handleResponse<Array<PresetResume>>(response);
};

/** Recupera a vaga de emprego padrão do backend.
 * @param signal - Um sinal de aborto opcional para cancelar a requisição.
 * @returns O objeto Job contendo os detalhes da vaga padrão.
 * @throws Um erro se a requisição falhar ou a resposta não for OK.
 */
export const fetchDefaultJob = async (signal?: AbortSignal): Promise<Job> => {
  const response = await fetch(`/api/presets/job`, { signal });

  return handleResponse<Job>(response);
};

/** Recupera o status do backend, incluindo se a API do OpenAI está configurada.
 * @param signal - Um sinal de aborto opcional para cancelar a requisição.
 * @returns Um objeto contendo o status da integração com a OpenAI.
 * @throws Um erro se a requisição falhar ou a resposta não for OK.
 */
export const fetchBackendStatus = async (
  signal?: AbortSignal
): Promise<{
  ai: { openaiConfigured: boolean };
}> => {
  const response = await fetch(`/api/status`, { signal });

  return handleResponse(response);
};

/** Cria uma nova análise de compatibilidade enviando os dados para o backend.
 * @param payload - O objeto MatchRequest contendo os dados da análise.
 * @param signal - Um sinal de aborto opcional para cancelar a requisição.
 * @returns O resumo da análise criada.
 * @throws Um erro se a requisição falhar ou a resposta não for OK.
 */
export const createMatch = async (payload: MatchRequest, signal?: AbortSignal): Promise<MatchSummary> => {
  const response = await fetch(`/api/match`, {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal,
  });

  return handleResponse<MatchSummary>(response);
};

/** Recupera a lista de resumos das análises de compatibilidade do backend.
 * @param signal - Um sinal de aborto opcional para cancelar a requisição.
 * @returns Um array de resumos das análises de compatibilidade.
 * @throws Um erro se a requisição falhar ou a resposta não for OK.
 */
export const fetchMatchSummaries = async (signal?: AbortSignal): Promise<Array<MatchSummary>> => {
  const response = await fetch(`/api/match`, { signal });

  return handleResponse<Array<MatchSummary>>(response);
};

/** Recupera o relatório detalhado de uma análise de compatibilidade pelo ID.
 * @param id - O ID da análise a ser recuperada.
 * @param signal - Um sinal de aborto opcional para cancelar a requisição.
 * @returns O objeto MatchResult contendo os detalhes da análise.
 * @throws Um erro se a requisição falhar ou a resposta não for OK.
 */
export const fetchMatchReport = async (id: string, signal?: AbortSignal): Promise<MatchResult> => {
  const response = await fetch(`/api/match/report/${id}`, { signal });

  return handleResponse<MatchResult>(response);
};
