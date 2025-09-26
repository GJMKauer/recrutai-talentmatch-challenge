import type { FastifyBaseLogger } from "fastify";
import { v4 as uuid } from "uuid";
import {
  MatchRequestSchema,
  buildMatchSummary,
  parseJob,
  type MatchRequestPayload,
  type MatchResult,
  type MatchSummary,
} from "../models/match.js";
import { analyzeMatch } from "./openaiClient.js";

type CreateMatchParams = {
  logger: FastifyBaseLogger;
  payload: MatchRequestPayload;
};

const matchStore = new Map<string, MatchResult>();

let analyzer = analyzeMatch;

/** Define uma função personalizada para análise de compatibilidade.
 * Útil para testes ou para substituir o comportamento padrão.
 * @param override - A função que substituirá a função de análise padrão.
 */
export const setMatchAnalyzer = (override: typeof analyzeMatch): void => {
  analyzer = override;
};

/** Restaura a função de análise de compatibilidade para a implementação padrão. */
export const resetMatchAnalyzer = (): void => {
  analyzer = analyzeMatch;
};

/** Cria uma nova análise de compatibilidade com base na carga útil fornecida.
 * Valida a carga útil, executa a análise e armazena o resultado em memória.
 * @param params - Um objeto contendo o logger e a carga útil da análise.
 * @returns Um objeto contendo o resultado completo da análise e um resumo.
 * @throws Um erro Zod se a validação da carga útil falhar.
 * @throws Outros erros podem ser lançados durante a análise ou armazenamento do resultado.
 */
export const createMatch = async (
  params: CreateMatchParams
): Promise<{ result: MatchResult; summary: MatchSummary }> => {
  const { logger, payload } = params;

  const data = MatchRequestSchema.parse(payload);
  const job = parseJob(data.job);
  const candidateId = data.candidate?.id ?? uuid();
  const matchId = uuid();

  const analysisResult = await analyzer({ job, logger, resumeMarkdown: data.resumeMarkdown });

  const result: MatchResult = {
    analysisSource: analysisResult.source,
    candidateId,
    createdAt: new Date().toISOString(),
    gaps: analysisResult.analysis.gaps,
    id: matchId,
    insights: analysisResult.analysis.insights,
    job,
    jobId: job.id,
    matchedSkills: analysisResult.analysis.matchedSkills,
    missingSkills: analysisResult.analysis.missingSkills,
    overallScore: Math.round(analysisResult.analysis.overallScore),
    resumeMarkdown: data.resumeMarkdown,
    strengths: analysisResult.analysis.strengths,
    suggestedQuestions: analysisResult.analysis.suggestedQuestions,
  };

  matchStore.set(result.id, result);

  logger.info(
    {
      candidateId,
      jobId: job.id,
      matchId: result.id,
      source: analysisResult.source,
    },
    "Match analysis stored in memory"
  );

  if (analysisResult.usage) {
    logger.info(
      {
        candidateId,
        jobId: job.id,
        matchId: result.id,
        usage: analysisResult.usage,
      },
      "OpenAI token usage for match analysis"
    );
  }

  return {
    result,
    summary: buildMatchSummary(result),
  };
};

/** Recupera o relatório completo de uma análise de compatibilidade pelo ID.
 * @param id - O ID da análise de compatibilidade a ser recuperada.
 * @returns O resultado completo da análise ou null se não for encontrado.
 */
export const getMatchReport = (id: string): MatchResult | null => {
  return matchStore.get(id) ?? null;
};

/** Lista os resumos de todas as análises de compatibilidade armazenadas em memória.
 * Os resumos são ordenados por data de criação, do mais recente ao mais antigo.
 * @returns Um array de resumos de análises de compatibilidade.
 */
export const listMatchSummaries = (): Array<MatchSummary> => {
  return Array.from(matchStore.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(buildMatchSummary);
};

/** Limpa todas as análises de compatibilidade armazenadas em memória. */
export const clearStore = (): void => {
  matchStore.clear();
};

resetMatchAnalyzer();
