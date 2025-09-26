import type { FastifyInstance } from "fastify";
import { getDefaultJobHandler } from "../controllers/jobController.js";
import { createMatchHandler, getMatchReportHandler, listMatchesHandler } from "../controllers/matchController.js";
import { listPresetResumesHandler } from "../controllers/resumeController.js";
import { isOpenAIEnabled } from "../services/openaiClient.js";

/** Registra as rotas da API relacionadas à análise de compatibilidade, vagas e currículos.
 * @param app - A instância do Fastify na qual as rotas serão registradas.
 */
export const registerMatchRoutes = async (app: FastifyInstance) => {
  app.post("/api/match", createMatchHandler);
  app.get("/api/match", listMatchesHandler);
  app.get("/api/match/report/:id", getMatchReportHandler);
  app.get("/api/presets/job", getDefaultJobHandler);
  app.get("/api/presets/resumes", listPresetResumesHandler);
  app.get("/api/status", async () => ({ ai: { openaiConfigured: isOpenAIEnabled() } }));
};
