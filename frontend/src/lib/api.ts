export type PresetResume = {
  filename: string;
  id: string;
  label: string;
  markdown: string;
};

export type Job = {
  company?: {
    name?: string;
  };
  description?: string;
  id: string;
  requirements?: {
    desirable?: Array<{
      category: string;
      items: Array<string | { language: string; level: string }>;
    }>;
    mandatory?: Array<{
      category: string;
      items: Array<string | { language: string; level: string }>;
    }>;
  };
  responsibilities?: Array<string>;
  title?: string;
};

export type MatchSummary = {
  analysisSource: "fallback" | "openai";
  candidateId: string;
  candidateName?: string;
  createdAt: string;
  id: string;
  jobId: string;
  overallScore: number;
};

export type MatchResult = MatchSummary & {
  gaps: Array<string>;
  insights: string;
  job: Job;
  matchedSkills: Array<string>;
  missingSkills: Array<string>;
  resumeMarkdown: string;
  strengths: Array<string>;
  suggestedQuestions?: Array<string>;
};

export type MatchRequest = {
  candidate?: {
    id?: string;
    name?: string;
  };
  job: unknown;
  resumeMarkdown: string;
  source?: "manual" | "preset" | "upload";
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new Error(message);
  }

  return (await response.json()) as T;
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    if (payload?.message) {
      return payload.message;
    }
  } catch {
    // ignore parse errors and fallback to status text
  }

  return response.statusText || "Unexpected API error";
}

export async function fetchPresetResumes(signal?: AbortSignal): Promise<Array<PresetResume>> {
  const response = await fetch(`${API_BASE}/presets/resumes`, { signal });
  return handleResponse<Array<PresetResume>>(response);
}

export async function fetchBackendStatus(signal?: AbortSignal): Promise<{
  ai: { openaiConfigured: boolean };
}> {
  const response = await fetch(`${API_BASE}/status`, { signal });
  return handleResponse(response);
}

export async function createMatch(payload: MatchRequest, signal?: AbortSignal): Promise<MatchSummary> {
  const response = await fetch(`${API_BASE}/match`, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    signal,
  });

  return handleResponse<MatchSummary>(response);
}

export async function fetchMatchSummaries(signal?: AbortSignal): Promise<Array<MatchSummary>> {
  const response = await fetch(`${API_BASE}/match`, { signal });

  return handleResponse<Array<MatchSummary>>(response);
}

export async function fetchMatchReport(id: string, signal?: AbortSignal): Promise<MatchResult> {
  const response = await fetch(`${API_BASE}/match/report/${id}`, { signal });

  return handleResponse<MatchResult>(response);
}
