import { promises as fs } from "fs";
import path from "path";
import { JobSchema, type Job } from "../models/job.js";

let cachedJob: Job | null = null;

const getJobFilePath = (): string => {
  return path.resolve(process.cwd(), "..", "mocks", "jobs", "jobdesc_eng_fullstack.json");
};

export const getDefaultJob = async (): Promise<Job> => {
  if (cachedJob) {
    return cachedJob;
  }

  const filePath = getJobFilePath();
  const contents = await fs.readFile(filePath, "utf-8");
  const parsed = JSON.parse(contents);
  const job = JobSchema.parse(parsed);

  cachedJob = job;
  return job;
};

export const clearJobCache = (): void => {
  cachedJob = null;
};
