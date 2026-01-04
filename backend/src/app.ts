import Fastify from "fastify";
import crypto from "node:crypto";
import { pool } from "./db/pool.js";

export function buildApp() {
  const app = Fastify({
    logger: true,
    genReqId: () => crypto.randomUUID(),
  });

  app.addHook("onRequest", async (req, reply) => {
    reply.header("x-request-id", req.id);
  });

  app.get("/health", async () => ({ ok: true }));

  // ✅ route DB bien à l'intérieur de buildApp()
  app.get("/health/db", async (_req, reply) => {
    try {
        await pool.query("SELECT 1");
        return { db: true };
    } catch (err) {
        app.log.error({ err }, "db health failed"); // 👈 important
        reply.code(500);
        return { db: false };
    }
    });


  return app;
}
