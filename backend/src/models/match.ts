import { z } from 'zod';

import { JobSchema, type Job } from './job.js';

export const MatchRequestSchema = z.object({
  job: z.unknown(),
  resumeMarkdown: z.string().min(1),
  candidate: z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
  source: z.enum(['upload', 'preset', 'manual']).optional(),
});

export type MatchRequestPayload = z.infer<typeof MatchRequestSchema>;

export interface MatchResult {
  id: string;
  candidateId: string;
  candidateName?: string;
  jobId: string;
  overallScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  insights: string;
  suggestedQuestions?: string[];
  strengths: string[];
  gaps: string[];
  analysisSource: 'openai' | 'fallback';
  job: Job;
  resumeMarkdown: string;
  createdAt: string;
}

export type MatchSummary = Pick<MatchResult, 'id' | 'candidateId' | 'candidateName' | 'jobId' | 'overallScore' | 'analysisSource' | 'createdAt'>;

export function buildMatchSummary(result: MatchResult): MatchSummary {
  const { id, candidateId, candidateName, jobId, overallScore, analysisSource, createdAt } = result;
  return { id, candidateId, candidateName, jobId, overallScore, analysisSource, createdAt };
}

export function parseJob(input: unknown): Job {
  return JobSchema.parse(input);
}
