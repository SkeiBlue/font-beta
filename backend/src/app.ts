import Fastify from "fastify";
import crypto from "node:crypto";

export function buildApp() {
  const app = Fastify({
    logger: true,
    // request id stable & lisible
    genReqId: () => crypto.randomUUID(),
  });

  // expose request id au client (utile debug front)
  app.addHook("onRequest", async (req, reply) => {
    reply.header("x-request-id", req.id);
  });

  app.get("/health", async () => ({ ok: true }));

  return app;
}
