import type { FastifyInstance } from 'fastify';

import {
  createMatchHandler,
  getMatchReportHandler,
  listMatchesHandler,
} from '../controllers/matchController.js';
import { listPresetResumesHandler } from '../controllers/resumeController.js';
import { isOpenAIEnabled } from '../services/openaiClient.js';

export async function registerMatchRoutes(app: FastifyInstance) {
  app.post('/api/match', createMatchHandler);
  app.get('/api/match', listMatchesHandler);
  app.get('/api/match/report/:id', getMatchReportHandler);
  app.get('/api/presets/resumes', listPresetResumesHandler);

  app.get('/api/status', async () => ({ ai: { openaiConfigured: isOpenAIEnabled() } }));
}
