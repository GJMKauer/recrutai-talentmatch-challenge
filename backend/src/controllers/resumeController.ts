import type { FastifyReply, FastifyRequest } from "fastify";

import { getPresetResumes } from "../services/resumeService.js";

export async function listPresetResumesHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const resumes = await getPresetResumes();
    return reply.send(resumes);
  } catch (error) {
    request.log.error({ err: error }, "Failed to load preset resumes");
    return reply.status(500).send({ message: "Failed to load preset resumes" });
  }
}
