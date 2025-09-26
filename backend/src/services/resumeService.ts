import { promises as fs } from "fs";
import path from "path";

export interface PresetResume {
  filename: string;
  id: string;
  label: string;
  markdown: string;
}

let cachedResumes: Array<PresetResume> | null = null;

const getResumeDirectory = (): string => {
  return path.resolve(process.cwd(), "..", "mocks", "cvs");
}

const loadResumes = async (): Promise<Array<PresetResume>> => {
  if (cachedResumes) {
    return cachedResumes;
  }

  const directory = getResumeDirectory();
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const resumes: Array<PresetResume> = [];

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

    resumes.push({ filename: entry.name, id, label, markdown });
  }

  cachedResumes = resumes;
  return resumes;
}

export const getPresetResumes = async (): Promise<Array<PresetResume>> => {
  const resumes = await loadResumes();
  return resumes.map((resume) => ({ ...resume }));
}

export const getPresetResume = async (id: string): Promise<PresetResume | null> => {
  const resumes = await loadResumes();
  return resumes.find((resume) => resume.id === id) ?? null;
}
