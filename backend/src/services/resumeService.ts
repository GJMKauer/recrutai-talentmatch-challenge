import { promises as fs } from "fs";
import path from "path";

export interface PresetResume {
  filename: string;
  id: string;
  label: string;
  markdown: string;
}

let cachedResumes: PresetResume[] | null = null;

function getResumeDirectory(): string {
  return path.resolve(process.cwd(), "..", "mocks", "cvs");
}

async function loadResumes(): Promise<PresetResume[]> {
  if (cachedResumes) {
    return cachedResumes;
  }

  const directory = getResumeDirectory();
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const resumes: PresetResume[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }

    const filePath = path.join(directory, entry.name);
    const markdown = await fs.readFile(filePath, "utf-8");
    const id = entry.name.replace(/\.md$/, "");
    const label = entry.name
      .replace(/candidate_cv_/i, "")
      .replace(/_/g, " ")
      .replace(/\.md$/, "")
      .replace(/\b\w/g, (match) => match.toUpperCase());

    resumes.push({ id, label, filename: entry.name, markdown });
  }

  cachedResumes = resumes;
  return resumes;
}

export async function getPresetResumes(): Promise<PresetResume[]> {
  const resumes = await loadResumes();
  return resumes.map((resume) => ({ ...resume }));
}

export async function getPresetResume(id: string): Promise<PresetResume | null> {
  const resumes = await loadResumes();
  return resumes.find((resume) => resume.id === id) ?? null;
}
