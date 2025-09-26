import { extractRequirementStrings } from "../models/job.js";
import { buildServer } from "../server.js";
import { clearJobCache } from "../services/jobService.js";
import { getPresetResume } from "../services/resumeService.js";
import { clearStore, resetMatchAnalyzer, setMatchAnalyzer } from "./testHooks.js";

if (process.env.NODE_ENV === "test") {
  void clearStore;
  void resetMatchAnalyzer;
  void setMatchAnalyzer;
}

void buildServer;
void extractRequirementStrings;
void clearJobCache;
void getPresetResume;
