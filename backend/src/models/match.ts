import { z } from "zod";
import { JobSchema, type Job } from "./job.js";

export const MatchRequestSchema = z.object({
  candidate: z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
  job: z.unknown(),
  resumeMarkdown: z.string().min(1),
  source: z.enum(["upload", "preset", "manual"]).optional(),
});

export type MatchRequestPayload = z.infer<typeof MatchRequestSchema>;

export interface MatchResult {
  analysisSource: "fallback" | "openai";
  candidateId: string;
  candidateName?: string;
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
  "id" | "candidateId" | "candidateName" | "jobId" | "overallScore" | "analysisSource" | "createdAt"
>;

export const buildMatchSummary = (result: MatchResult): MatchSummary => {
  const { analysisSource, candidateId, candidateName, createdAt, id, jobId, overallScore } = result;
  return { analysisSource, candidateId, candidateName, createdAt, id, jobId, overallScore };
}

export const parseJob = (input: unknown): Job => {
  return JobSchema.parse(input);
}
