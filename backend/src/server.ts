import cors from "@fastify/cors";
import "dotenv/config";
import Fastify from "fastify";
import { registerMatchRoutes } from "./routes/matchRoutes.js";

const PORT = Number(process.env.PORT ?? 3333);
const HOST = process.env.HOST ?? "0.0.0.0";

export const buildServer = async () => {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
    },
  });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(",").map((origin) => origin.trim()) ?? true,
  });

  await app.register(registerMatchRoutes);

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = await buildServer();

  try {
    await app.listen({ host: HOST, port: PORT });
    app.log.info(`Server ready on http://${HOST}:${PORT}`);
  } catch (error) {
    app.log.error({ err: error }, "Failed to start server");
    process.exit(1);
  }
}
