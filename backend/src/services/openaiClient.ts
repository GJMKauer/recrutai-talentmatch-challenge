import type { FastifyBaseLogger } from "fastify";
import OpenAI from "openai";
import { z } from "zod";
import { extractJobKeywords, type Job } from "../models/job.js";
import { extractJson } from "../utils/json.js";
import { systemPrompt } from "../utils/openAiPrompts.js";

/** Esquema Zod para validar a estrutura da análise de compatibilidade retornada pela OpenAI ou gerada heurísticamente. */
const matchAnalysisSchema = z.object({
  gaps: z.array(z.string()).default([]),
  insights: z.string().default(""),
  matchedSkills: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  overallScore: z.number().min(0).max(100),
  strengths: z.array(z.string()).default([]),
  suggestedQuestions: z.array(z.string()).optional(),
});

export type MatchAnalysis = z.infer<typeof matchAnalysisSchema>;

type Logger = Pick<FastifyBaseLogger, "info" | "warn" | "error">;

type AnalysisResult = {
  analysis: MatchAnalysis;
  source: "fallback" | "openai";
  usage?: { completionTokens?: number; promptTokens?: number; totalTokens?: number };
};

type AnalyzeMatchParams = {
  job: Job;
  logger: Logger;
  resumeMarkdown: string;
};

const openAiApiKey = process.env.OPENAI_API_KEY;
const openAiModel = process.env.OPENAI_MATCH_MODEL ?? "gpt-4o-mini";

const openAiClient = openAiApiKey ? new OpenAI({ apiKey: openAiApiKey }) : null;

/** Verifica se a integração com a OpenAI está habilitada. */
export const isOpenAIEnabled = (): boolean => {
  return Boolean(openAiClient);
};

/** Cria uma nova análise de compatibilidade com base no payload fornecido.
 * Valida o payload, executa a análise e armazena o resultado em memória.
 * @param params - Um objeto contendo o logger e o payload da análise.
 * @returns Um objeto contendo o resultado completo da análise e um resumo.
 * @throws Um erro Zod se a validação do payload falhar.
 * @throws Outros erros podem ser lançados durante a análise ou armazenamento do resultado.
 */
export const analyzeMatch = async (params: AnalyzeMatchParams): Promise<AnalysisResult> => {
  const { job, logger, resumeMarkdown } = params;

  if (!openAiClient) {
    const analysis = computeFallbackAnalysis(job, resumeMarkdown);
    logger.warn({ jobId: job.id, source: "fallback" }, "OpenAI API key not provided, using heuristic analysis");
    return { analysis, source: "fallback" };
  }

  const startedAt = Date.now();

  try {
    const response = await openAiClient.responses.create({
      input: [
        {
          content: [
            {
              text: systemPrompt,
              type: "input_text",
            },
          ],
          role: "system",
        },
        {
          content: [
            {
              text: `Job JSON:\n${JSON.stringify(job, null, 2)}\n\nResume Markdown:\n${resumeMarkdown}`,
              type: "input_text",
            },
          ],
          role: "user",
        },
      ],
      max_output_tokens: 800,
      model: openAiModel,
      temperature: 0.2,
    });

    const durationMs = Date.now() - startedAt;
    const rawText = response.output_text?.trim();
    if (!rawText) throw new Error("Empty response from OpenAI");

    const jsonText = extractJson(rawText);
    const parsed = matchAnalysisSchema.parse(JSON.parse(jsonText));

    logger.info(
      {
        durationMs,
        jobId: job.id,
        model: openAiModel,
        source: "openai",
        tokens: response.usage,
      },
      "OpenAI analysis completed"
    );

    return {
      analysis: parsed,
      source: "openai",
      usage: {
        completionTokens: response.usage?.output_tokens,
        promptTokens: response.usage?.input_tokens,
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
};

/** Computa uma análise heurística de compatibilidade entre a vaga e o currículo.
 * Utiliza correspondência simples de palavras-chave e regras baseadas em expressões regulares.
 * @param job - O objeto Job contendo os detalhes da vaga.
 * @param resumeMarkdown - O currículo do candidato em formato Markdown.
 * @returns Um objeto MatchAnalysis contendo os resultados da análise.
 */
const computeFallbackAnalysis = (job: Job, resumeMarkdown: string): MatchAnalysis => {
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

  const insightParts = [] as Array<string>;
  insightParts.push(
    `Cobertura estimada de ${(coverage * 100).toFixed(0)}% dos requisitos mencionados para ${job.title}.`
  );
  if (missingHighlights.length > 0) {
    insightParts.push(`Pontos de atenção: ${missingHighlights.join(", ")}.`);
  } else {
    insightParts.push("Nenhuma lacuna crítica identificada nos requisitos analisados.");
  }

  return {
    gaps: missingHighlights,
    insights: insightParts.join(" "),
    matchedSkills: Array.from(matched).sort(),
    missingSkills: Array.from(missing).sort(),
    overallScore: score,
    strengths: Array.from(matched).slice(0, 5),
    suggestedQuestions,
  };
};
