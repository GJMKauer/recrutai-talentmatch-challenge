import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  clearStore,
  createMatch,
  getMatchReport,
  listMatchSummaries,
  resetMatchAnalyzer,
  setMatchAnalyzer,
} from '../dist/services/matchService.js';

function createSpy() {
  const spy = (...args) => {
    spy.calls.push(args);
  };

  spy.calls = [];

  return spy;
}

function createLogger() {
  const info = createSpy();
  const warn = createSpy();
  const error = createSpy();

  const base = {
    info,
    warn,
    error,
    debug: createSpy(),
    trace: createSpy(),
    fatal: createSpy(),
  };

  base.child = () => base;

  return base;
}

function loadResumeMarkdown(filename) {
  const baseDir = path.resolve(process.cwd(), '..', 'mocks', 'cvs');
  const filePath = path.join(baseDir, filename);
  return readFileSync(filePath, 'utf-8');
}

function loadJobFixture() {
  const jobPath = path.resolve(process.cwd(), '..', 'mocks', 'jobs', 'jobdesc_eng_fullstack.json');
  return JSON.parse(readFileSync(jobPath, 'utf-8'));
}

const jobFixture = loadJobFixture();
const sampleResume = loadResumeMarkdown('candidate_cv_joao_santos.md');

describe('matchService', () => {
  beforeEach(() => {
    clearStore();
    resetMatchAnalyzer();
  });

  afterEach(() => {
    resetMatchAnalyzer();
  });

  it('creates and stores a match result using heuristic fallback when OpenAI is disabled', async () => {
    const logger = createLogger();

    const { summary } = await createMatch({
      payload: {
        job: jobFixture,
        resumeMarkdown: sampleResume,
        candidate: { name: 'João Santos' },
      },
      logger,
    });

    assert.ok(summary.id);
    assert.equal(summary.analysisSource, 'fallback');
    assert.ok(summary.overallScore > 0);

    const report = getMatchReport(summary.id);
    assert.ok(report);
    assert.equal(report?.candidateName, 'João Santos');
    assert.ok(report?.matchedSkills.length);
    assert.ok(logger.warn.calls.length > 0);
  });

  it('returns summaries sorted by most recent creation date', async () => {
    const logger = createLogger();

    const first = await createMatch({
      payload: {
        job: jobFixture,
        resumeMarkdown: sampleResume,
        candidate: { id: 'candidate-1', name: 'João Santos' },
      },
      logger,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    const second = await createMatch({
      payload: {
        job: jobFixture,
        resumeMarkdown: sampleResume,
        candidate: { id: 'candidate-2', name: 'Maria Silva' },
      },
      logger,
    });

    const summaries = listMatchSummaries();
    assert.deepEqual(
      summaries.map((item) => item.id),
      [second.summary.id, first.summary.id],
    );
  });

  it('uses injected analyzer results when available', async () => {
    const logger = createLogger();

    setMatchAnalyzer(async () => ({
      analysis: {
        overallScore: 91,
        matchedSkills: ['Node.js'],
        missingSkills: ['Terraform'],
        insights: 'Excelente aderência técnica.',
        strengths: ['Node.js'],
        gaps: ['Terraform'],
        suggestedQuestions: ['Conte sobre a experiência com Terraform.'],
      },
      source: 'openai',
      usage: {
        totalTokens: 640,
      },
    }));

    const { summary } = await createMatch({
      payload: {
        job: jobFixture,
        resumeMarkdown: sampleResume,
        candidate: { id: 'candidate-3', name: 'Ana Ferreira' },
      },
      logger,
    });

    assert.equal(summary.analysisSource, 'openai');
    assert.equal(summary.overallScore, 91);
    assert.ok(logger.info.calls.length >= 1);
  });
});
