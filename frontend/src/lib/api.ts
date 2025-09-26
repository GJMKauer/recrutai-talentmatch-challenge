export type PresetResume = {
  id: string;
  label: string;
  filename: string;
  markdown: string;
};

export type Job = {
  id: string;
  title?: string;
  company?: {
    name?: string;
  };
  description?: string;
  responsibilities?: string[];
  requirements?: {
    mandatory?: Array<{
      category: string;
      items: Array<string | { language: string; level: string }>;
    }>;
    desirable?: Array<{
      category: string;
      items: Array<string | { language: string; level: string }>;
    }>;
  };
};

export type MatchSummary = {
  id: string;
  candidateId: string;
  candidateName?: string;
  jobId: string;
  overallScore: number;
  analysisSource: 'openai' | 'fallback';
  createdAt: string;
};

export type MatchResult = MatchSummary & {
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  gaps: string[];
  insights: string;
  suggestedQuestions?: string[];
  resumeMarkdown: string;
  job: Job;
};

export type MatchRequest = {
  job: unknown;
  resumeMarkdown: string;
  candidate?: {
    id?: string;
    name?: string;
  };
  source?: 'upload' | 'preset' | 'manual';
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

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

  return response.statusText || 'Unexpected API error';
}

export async function fetchPresetResumes(signal?: AbortSignal): Promise<PresetResume[]> {
  const response = await fetch(`${API_BASE}/presets/resumes`, { signal });
  return handleResponse<PresetResume[]>(response);
}

export async function fetchBackendStatus(signal?: AbortSignal): Promise<{
  ai: { openaiConfigured: boolean };
}> {
  const response = await fetch(`${API_BASE}/status`, { signal });
  return handleResponse(response);
}

export async function createMatch(payload: MatchRequest, signal?: AbortSignal): Promise<MatchSummary> {
  const response = await fetch(`${API_BASE}/match`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  });

  return handleResponse<MatchSummary>(response);
}

export async function fetchMatchSummaries(signal?: AbortSignal): Promise<MatchSummary[]> {
  const response = await fetch(`${API_BASE}/match`, { signal });
  return handleResponse<MatchSummary[]>(response);
}

export async function fetchMatchReport(id: string, signal?: AbortSignal): Promise<MatchResult> {
  const response = await fetch(`${API_BASE}/match/report/${id}`, { signal });
  return handleResponse<MatchResult>(response);
}
