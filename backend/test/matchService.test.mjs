import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { afterEach, beforeEach, describe, it } from "node:test";
import { clearStore, resetMatchAnalyzer, setMatchAnalyzer } from "../dist/internal/testHooks.js";
import { createMatch, getMatchReport, listMatchSummaries } from "../dist/services/matchService.js";

/** Cria um espião para capturar chamadas de função */
const createSpy = () => {
  const spy = (...args) => {
    spy.calls.push(args);
  };

  spy.calls = [];

  return spy;
};

/** Cria um logger falso que captura chamadas de log */
const createLogger = () => {
  const info = createSpy();
  const warn = createSpy();
  const error = createSpy();

  const base = {
    debug: createSpy(),
    error,
    fatal: createSpy(),
    info,
    trace: createSpy(),
    warn,
  };

  base.child = () => base;

  return base;
};

/** Carrega um currículo de teste em Markdown */
const loadResumeMarkdown = (filename) => {
  const baseDir = path.resolve(process.cwd(), "..", "mocks", "cvs");
  const filePath = path.join(baseDir, filename);

  return readFileSync(filePath, "utf-8");
};

/** Carrega uma descrição de vaga de teste */
const loadJobFixture = () => {
  const jobPath = path.resolve(process.cwd(), "..", "mocks", "jobs", "jobdesc_eng_fullstack.json");

  return JSON.parse(readFileSync(jobPath, "utf-8"));
};

const jobFixture = loadJobFixture();
const sampleResume = loadResumeMarkdown("candidate_cv_joao_santos.md");

describe("matchService", () => {
  beforeEach(() => {
    clearStore();
    resetMatchAnalyzer();
  });

  afterEach(() => {
    resetMatchAnalyzer();
  });

  it("creates and stores a match result using heuristic fallback when OpenAI is disabled", async () => {
    const logger = createLogger();

    const { summary } = await createMatch({
      logger,
      payload: { job: jobFixture, resumeMarkdown: sampleResume },
    });

    assert.ok(summary.id);
    assert.equal(summary.analysisSource, "fallback");
    assert.ok(summary.overallScore > 0);

    const report = getMatchReport(summary.id);
    assert.ok(report);
    assert.ok(report?.matchedSkills.length);
    assert.ok(logger.warn.calls.length > 0);
  });

  it("returns summaries sorted by most recent creation date", async () => {
    const logger = createLogger();

    const first = await createMatch({
      logger,
      payload: { job: jobFixture, resumeMarkdown: sampleResume },
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    const second = await createMatch({
      logger,
      payload: { job: jobFixture, resumeMarkdown: sampleResume },
    });

    const summaries = listMatchSummaries();
    assert.deepEqual(
      summaries.map((s) => s.createdAt),
      [second.summary.createdAt, first.summary.createdAt]
    );
  });

  it("uses injected analyzer results when available", async () => {
    const logger = createLogger();

    setMatchAnalyzer(async () => ({
      analysis: {
        gaps: ["Terraform"],
        insights: "Excelente aderência técnica.",
        matchedSkills: ["Node.js"],
        missingSkills: ["Terraform"],
        overallScore: 91,
        strengths: ["Node.js"],
        suggestedQuestions: ["Conte sobre a experiência com Terraform."],
      },
      source: "openai",
      usage: {
        totalTokens: 640,
      },
    }));

    const { summary } = await createMatch({
      logger,
      payload: {
        candidate: { id: "candidate-3", name: "Ana Ferreira" },
        job: jobFixture,
        resumeMarkdown: sampleResume,
      },
    });

    assert.equal(summary.analysisSource, "openai");
    assert.equal(summary.overallScore, 91);
    assert.ok(logger.info.calls.length >= 1);
  });

  it("retorna fallback seguro quando o conteúdo do currículo não é textual", async () => {
    const logger = createLogger();

    const { result, summary } = await createMatch({
      logger,
      payload: {
        job: jobFixture,
        resumeMarkdown: "\u0000\u0001WEBP\u0002\u0003",
      },
    });

    assert.equal(summary.analysisSource, "fallback");
    assert.equal(summary.overallScore, 0);
    assert.deepEqual(result.matchedSkills, []);
    assert.ok(result.gaps.includes("Currículo inválido ou ilegível."));
    assert.ok(logger.warn.calls.some(([, message]) => typeof message === "string" && message.includes("invalid")));
  });
});
