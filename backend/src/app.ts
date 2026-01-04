import Fastify from "fastify";
import crypto from "node:crypto";
import { pool } from "./db/pool.js";
import { AppError } from "./common/errors/AppError.js";
import { ErrorCodes } from "./common/errors/errorCodes.js";
import { authRoutes } from "./auth/routes.js";
import { requireAuth, requireAdmin } from "./auth/guards.js";

export function buildApp() {
  const app = Fastify({
    logger: true,
    genReqId: () => crypto.randomUUID(),
  });

  app.addHook("onRequest", async (req, reply) => {
    reply.header("x-request-id", req.id);
  });

  app.get("/health", async () => ({ ok: true }));

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

  authRoutes(app);

  app.get("/me", { preHandler: async (req) => requireAuth(req) }, async (req) => {
    return { user: req.user ?? null };
  });

  app.get("/admin/ping", { preHandler: async (req) => requireAdmin(req) }, async () => {
    return { ok: true };
  });

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

  app.setErrorHandler(async (err, req, reply) => {
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

    req.log.error({ err }, "unhandled error");
    reply.code(500);

    // DEV: renvoie le message de l'erreur (pratique pour debug)
    const isProd = process.env.NODE_ENV === "production";
    const details = isProd ? null : { name: err.name, message: err.message };

    return {
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Internal server error",
        statusCode: 500,
        request_id: req.id,
        details,
      },
    };
  });

  return app;
}
