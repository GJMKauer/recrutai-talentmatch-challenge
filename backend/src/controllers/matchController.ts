import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import type { MatchRequestPayload } from "../models/match.js";
import { createMatch, getMatchReport, listMatchSummaries } from "../services/matchService.js";

/**
 * Handler para criar uma nova análise de compatibilidade.
 * @param request - Objeto de requisição do Fastify contendo o payload da análise.
 * @param reply - Objeto de resposta do Fastify.
 * @returns O resumo da análise criada ou um erro apropriado em caso de falha.
 */
export const createMatchHandler = async (
  request: FastifyRequest<{ Body: MatchRequestPayload }>,
  reply: FastifyReply
) => {
  try {
    const { summary } = await createMatch({
      logger: request.log,
      payload: request.body,
    });

    return reply.status(201).send(summary);
  } catch (error) {
    if (error instanceof ZodError) {
      return reply.status(400).send({ issues: error.issues, message: "Invalid request payload" });
    }

    request.log.error({ err: error }, "Unexpected error while creating match");
    return reply.status(500).send({ message: "Unexpected error while processing match" });
  }
};

export const getMatchReportHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const match = getMatchReport(request.params.id);

  if (!match) {
    return reply.status(404).send({ message: "Match result not found" });
  }

  return reply.send(match);
};

export const listMatchesHandler = async (_: FastifyRequest, reply: FastifyReply) => {
  const matches = listMatchSummaries();

  return reply.send(matches);
};
