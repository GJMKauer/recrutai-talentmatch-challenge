import type { FastifyReply, FastifyRequest } from "fastify";
import { getPresetResumes } from "../services/resumeService.js";

/**
 * Handler para listar currículos predefinidos.
 * @param request - Objeto de requisição do Fastify.
 * @param reply - Objeto de resposta do Fastify.
 * @returns A lista de currículos predefinidos ou um erro 500 em caso de falha.
 */
export const listPresetResumesHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const resumes = await getPresetResumes();

    return reply.send(resumes);
  } catch (error) {
    request.log.error({ err: error }, "Failed to load preset resumes");
    return reply.status(500).send({ message: "Failed to load preset resumes" });
  }
};
