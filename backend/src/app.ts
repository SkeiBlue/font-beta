import Fastify from "fastify";
import crypto from "node:crypto";
import { pool } from "./db/pool.js";
import { AppError } from "./common/errors/AppError.js";
import { ErrorCodes } from "./common/errors/errorCodes.js";

export function buildApp() {
  const app = Fastify({
    logger: true,
    genReqId: () => crypto.randomUUID(),
  });

  // expose request id in response headers
  app.addHook("onRequest", async (req, reply) => {
    reply.header("x-request-id", req.id);
  });

  // basic health
  app.get("/health", async () => ({ ok: true }));

  // db health (kept for roadmap step 0.3)
  app.get("/health/db", async (_req, reply) => {
    try {
      await pool.query("SELECT 1");
      return { db: true };
    } catch (err) {
      app.log.error({ err }, "db health failed");
      reply.code(500);
      return { db: false };
    }
  });

  // standard 404
  app.setNotFoundHandler(async (req, reply) => {
    reply.code(404);
    return {
      error: {
        code: ErrorCodes.NOT_FOUND,
        message: "Route not found",
        statusCode: 404,
        request_id: req.id,
      },
    };
  });

  // standard error handler
  app.setErrorHandler(async (err, req, reply) => {
    // business error
    if (err instanceof AppError) {
      reply.code(err.statusCode);
      return {
        error: {
          code: err.code,
          message: err.message,
          statusCode: err.statusCode,
          request_id: req.id,
          details: err.details ?? null,
        },
      };
    }

    // fallback 500
    req.log.error({ err }, "unhandled error");
    reply.code(500);
    return {
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Internal server error",
        statusCode: 500,
        request_id: req.id,
      },
    };
  });

  return app;
}
