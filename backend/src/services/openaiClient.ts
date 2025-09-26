import type { FastifyBaseLogger } from "fastify";

import OpenAI from "openai";
import { z } from "zod";

import { extractJobKeywords, type Job } from "../models/job.js";

const matchAnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100),
  matchedSkills: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  insights: z.string().default(""),
  strengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  suggestedQuestions: z.array(z.string()).optional(),
});

export type MatchAnalysis = z.infer<typeof matchAnalysisSchema>;

const openAiApiKey = process.env.OPENAI_API_KEY;
console.log("Using OpenAI API Key:", openAiApiKey ? "Provided" : "Not Provided");
console.log("Key:", openAiApiKey);
const openAiModel = process.env.OPENAI_MATCH_MODEL ?? "gpt-4o-mini";

const openAiClient = openAiApiKey ? new OpenAI({ apiKey: openAiApiKey }) : null;

export function isOpenAIEnabled(): boolean {
  return Boolean(openAiClient);
}

type Logger = Pick<FastifyBaseLogger, "info" | "warn" | "error">;

type AnalysisResult = {
  analysis: MatchAnalysis;
  source: "openai" | "fallback";
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
};

export async function analyzeMatch({
  job,
  resumeMarkdown,
  logger,
}: {
  job: Job;
  resumeMarkdown: string;
  logger: Logger;
}): Promise<AnalysisResult> {
  if (!openAiClient) {
    const analysis = computeFallbackAnalysis(job, resumeMarkdown);
    logger.warn({ source: "fallback", jobId: job.id }, "OpenAI API key not provided, using heuristic analysis");
    return { analysis, source: "fallback" };
  }

  const startedAt = Date.now();
  try {
    const response = await openAiClient.responses.create({
      model: openAiModel,
      temperature: 0.2,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: 'Você é um avaliador de vagas. Compare o currículo com a vaga e responda exclusivamente com JSON seguindo o formato: {"overallScore": number 0-100, "matchedSkills": string[], "missingSkills": string[], "insights": string, "strengths": string[], "gaps": string[], "suggestedQuestions": string[]}.',
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Job JSON:\n${JSON.stringify(job, null, 2)}\n\nResume Markdown:\n${resumeMarkdown}`,
            },
          ],
        },
      ],
      max_output_tokens: 800,
    });

    const durationMs = Date.now() - startedAt;
    const rawText = response.output_text?.trim();

    if (!rawText) {
      throw new Error("Empty response from OpenAI");
    }

    const parsed = matchAnalysisSchema.parse(JSON.parse(rawText));

    logger.info(
      {
        source: "openai",
        model: openAiModel,
        durationMs,
        jobId: job.id,
        tokens: response.usage,
      },
      "OpenAI analysis completed"
    );

    return {
      analysis: parsed,
      source: "openai",
      usage: {
        promptTokens: response.usage?.input_tokens,
        completionTokens: response.usage?.output_tokens,
        totalTokens: response.usage?.total_tokens,
      },
    };
  } catch (error) {
    logger.error(
      {
        err: error instanceof Error ? error : undefined,
        jobId: job.id,
      },
      "Failed to obtain analysis from OpenAI, falling back to heuristic scoring"
    );

    const analysis = computeFallbackAnalysis(job, resumeMarkdown);
    return { analysis, source: "fallback" };
  }
}

function computeFallbackAnalysis(job: Job, resumeMarkdown: string): MatchAnalysis {
  const normalizedResume = resumeMarkdown.toLowerCase();
  const keywords = extractJobKeywords(job);
  const matched = new Set<string>();
  const missing = new Set<string>();

  keywords.forEach((keyword) => {
    const normalizedKeyword = keyword.toLowerCase();
    if (normalizedKeyword.length < 3) {
      return;
    }

    if (normalizedResume.includes(normalizedKeyword)) {
      matched.add(keyword);
    } else {
      missing.add(keyword);
    }
  });

  const total = matched.size + missing.size;
  const coverage = total > 0 ? matched.size / total : 0.5;

  let score = Math.round(55 + coverage * 40);

  if (/typescript|typescript/i.test(resumeMarkdown)) {
    score += 3;
  }

  if (/node\.js|nodejs|fastify|express/i.test(resumeMarkdown)) {
    score += 3;
  }

  if (/react|next\.js|vite/i.test(resumeMarkdown)) {
    score += 3;
  }

  if (/aws|azure|gcp/i.test(resumeMarkdown)) {
    score += 2;
  }

  score = Math.max(10, Math.min(100, score));

  const missingHighlights = Array.from(missing).slice(0, 5);
  const suggestedQuestions = missingHighlights.map((item) => `Conte sobre sua experiência recente com ${item}.`);

  const insightParts = [] as string[];
  insightParts.push(
    `Cobertura estimada de ${(coverage * 100).toFixed(0)}% dos requisitos mencionados para ${job.title}.`
  );
  if (missingHighlights.length > 0) {
    insightParts.push(`Pontos de atenção: ${missingHighlights.join(", ")}.`);
  } else {
    insightParts.push("Nenhuma lacuna crítica identificada nos requisitos analisados.");
  }

  return {
    overallScore: score,
    matchedSkills: Array.from(matched).sort(),
    missingSkills: Array.from(missing).sort(),
    insights: insightParts.join(" "),
    strengths: Array.from(matched).slice(0, 5),
    gaps: missingHighlights,
    suggestedQuestions,
  };
}
