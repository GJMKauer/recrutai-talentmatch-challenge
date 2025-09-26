import { z } from "zod";
import { JobSchema, type Job } from "./job.js";

/** Esquema Zod para validar e tipar solicitação de análise de compatibilidade (MatchRequestPayload).
 * Inclui detalhes sobre o candidato, a vaga, o currículo em markdown e a fonte do currículo.
 */
export const MatchRequestSchema = z.object({
  candidate: z.object({ id: z.string().optional(), name: z.string().optional() }).optional(),
  job: JobSchema,
  resumeMarkdown: z.string().min(1),
  source: z.enum(["upload", "preset", "manual"]).optional(),
});

export type MatchRequestPayload = z.infer<typeof MatchRequestSchema>;

export interface MatchResult {
  analysisSource: "fallback" | "openai";
  candidateId: string;
  createdAt: string;
  gaps: Array<string>;
  id: string;
  insights: string;
  job: Job;
  jobId: string;
  matchedSkills: Array<string>;
  missingSkills: Array<string>;
  overallScore: number;
  resumeMarkdown: string;
  strengths: Array<string>;
  suggestedQuestions?: Array<string>;
}

export type MatchSummary = Pick<
  MatchResult,
  "id" | "candidateId" | "jobId" | "overallScore" | "analysisSource" | "createdAt"
>;

/** Constrói um resumo da análise de compatibilidade a partir do resultado completo.
 * @param result - O resultado completo da análise de compatibilidade.
 * @returns Um objeto contendo apenas os campos do resumo da análise.
 */
export const buildMatchSummary = (result: MatchResult): MatchSummary => {
  const { analysisSource, candidateId, createdAt, id, jobId, overallScore } = result;

  return { analysisSource, candidateId, createdAt, id, jobId, overallScore };
};

/** Valida e faz o parsing de uma entrada desconhecida como um objeto Job.
 * @param input - A entrada desconhecida a ser validada e convertida.
 * @returns O objeto Job validado.
 * @throws Um erro Zod se a validação falhar.
 */
export const parseJob = (input: unknown): Job => {
  return JobSchema.parse(input);
};
