import type { FastifyReply, FastifyRequest } from "fastify";
import { getDefaultJob } from "../services/jobService.js";

/**
 * Handler para obter a descrição de vaga padrão.
 * @param request - Objeto de requisição do Fastify.
 * @param reply - Objeto de resposta do Fastify.
 * @returns A descrição da vaga padrão ou um erro 500 em caso de falha.
 */
export const getDefaultJobHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const job = await getDefaultJob();

    return reply.send(job);
  } catch (error) {
    request.log.error({ err: error }, "Failed to load default job description");

    return reply.status(500).send({ message: "Não foi possível carregar a vaga padrão." });
  }
};
