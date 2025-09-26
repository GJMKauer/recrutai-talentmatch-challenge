import type { FastifyReply, FastifyRequest } from "fastify";
import type { MatchRequestPayload } from "../models/match.js";

import { ZodError } from "zod";

import { createMatch, getMatchReport, listMatchSummaries } from "../services/matchService.js";

export async function createMatchHandler(request: FastifyRequest<{ Body: MatchRequestPayload }>, reply: FastifyReply) {
  try {
    const { summary } = await createMatch({
      payload: request.body,
      logger: request.log,
    });

    return reply.status(201).send(summary);
  } catch (error) {
    if (error instanceof ZodError) {
      return reply.status(400).send({ message: "Invalid request payload", issues: error.issues });
    }

    request.log.error({ err: error }, "Unexpected error while creating match");
    return reply.status(500).send({ message: "Unexpected error while processing match" });
  }
}

export async function getMatchReportHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const match = getMatchReport(request.params.id);

  if (!match) {
    return reply.status(404).send({ message: "Match result not found" });
  }

  return reply.send(match);
}

export async function listMatchesHandler(request: FastifyRequest, reply: FastifyReply) {
  const matches = listMatchSummaries();
  return reply.send(matches);
}
