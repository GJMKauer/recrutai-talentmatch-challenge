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

const matchStore = new Map<string, MatchResult>();
let analyzer = analyzeMatch;

export const setMatchAnalyzer = (override: typeof analyzeMatch): void => {
  analyzer = override;
};

export const resetMatchAnalyzer = (): void => {
  analyzer = analyzeMatch;
};

export const createMatch = async ({
  logger,
  payload,
}: {
  logger: FastifyBaseLogger;
  payload: MatchRequestPayload;
}): Promise<{ result: MatchResult; summary: MatchSummary }> => {
  const data = MatchRequestSchema.parse(payload);
  const job = parseJob(data.job);
  const candidateId = data.candidate?.id ?? uuid();
  const matchId = uuid();

  const analysisResult = await analyzer({
    job,
    logger,
    resumeMarkdown: data.resumeMarkdown,
  });

  const result: MatchResult = {
    analysisSource: analysisResult.source,
    candidateId,
    candidateName: data.candidate?.name,
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

export const getMatchReport = (id: string): MatchResult | null => {
  return matchStore.get(id) ?? null;
};

export const listMatchSummaries = (): Array<MatchSummary> => {
  return Array.from(matchStore.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(buildMatchSummary);
};

export const clearStore = (): void => {
  matchStore.clear();
};

resetMatchAnalyzer();
