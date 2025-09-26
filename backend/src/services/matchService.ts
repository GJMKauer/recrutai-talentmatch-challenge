import type { FastifyBaseLogger } from 'fastify';

import { v4 as uuid } from 'uuid';

import {
  MatchRequestSchema,
  buildMatchSummary,
  parseJob,
  type MatchRequestPayload,
  type MatchResult,
  type MatchSummary,
} from '../models/match.js';

import { analyzeMatch } from './openaiClient.js';

const matchStore = new Map<string, MatchResult>();
let analyzer = analyzeMatch;

export function setMatchAnalyzer(override: typeof analyzeMatch): void {
  analyzer = override;
}

export function resetMatchAnalyzer(): void {
  analyzer = analyzeMatch;
}

export async function createMatch({
  payload,
  logger,
}: {
  payload: MatchRequestPayload;
  logger: FastifyBaseLogger;
}): Promise<{ summary: MatchSummary; result: MatchResult }> {
  const data = MatchRequestSchema.parse(payload);
  const job = parseJob(data.job);
  const candidateId = data.candidate?.id ?? uuid();
  const matchId = uuid();

  const analysisResult = await analyzer({
    job,
    resumeMarkdown: data.resumeMarkdown,
    logger,
  });

  const result: MatchResult = {
    id: matchId,
    candidateId,
    candidateName: data.candidate?.name,
    jobId: job.id,
    overallScore: Math.round(analysisResult.analysis.overallScore),
    matchedSkills: analysisResult.analysis.matchedSkills,
    missingSkills: analysisResult.analysis.missingSkills,
    insights: analysisResult.analysis.insights,
    suggestedQuestions: analysisResult.analysis.suggestedQuestions,
    strengths: analysisResult.analysis.strengths,
    gaps: analysisResult.analysis.gaps,
    analysisSource: analysisResult.source,
    job,
    resumeMarkdown: data.resumeMarkdown,
    createdAt: new Date().toISOString(),
  };

  matchStore.set(result.id, result);

  logger.info(
    {
      matchId: result.id,
      jobId: job.id,
      candidateId,
      source: analysisResult.source,
    },
    'Match analysis stored in memory',
  );

  if (analysisResult.usage) {
    logger.info(
      {
        matchId: result.id,
        jobId: job.id,
        candidateId,
        usage: analysisResult.usage,
      },
      'OpenAI token usage for match analysis',
    );
  }

  return {
    summary: buildMatchSummary(result),
    result,
  };
}

export function getMatchReport(id: string): MatchResult | null {
  return matchStore.get(id) ?? null;
}

export function listMatchSummaries(): MatchSummary[] {
  return Array.from(matchStore.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(buildMatchSummary);
}

export function clearStore(): void {
  matchStore.clear();
}

resetMatchAnalyzer();
