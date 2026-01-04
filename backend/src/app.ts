import Fastify from "fastify";
import crypto from "node:crypto";
import { pool } from "./db/pool.js";
import { AppError } from "./common/errors/AppError.js";
import { ErrorCodes } from "./common/errors/errorCodes.js";
import { authRoutes } from "./auth/routes.js";
import { requireAuth, requireAdmin } from "./auth/guards.js";
import { registerRateLimit } from "./plugins/rateLimit.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
    genReqId: () => crypto.randomUUID(),
  });

  app.addHook("onRequest", async (req, reply) => {
    reply.header("x-request-id", req.id);
  });

  //  IMPORTANT: wait plugin before declaring routes
  await registerRateLimit(app);

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

  app.get("/me", { preHandler: async (req) => requireAuth(req) }, async (req) => ({
    user: req.user ?? null,
  }));

  app.get("/admin/ping", { preHandler: async (req) => requireAdmin(req) }, async () => ({
    ok: true,
  }));

  // placeholder upload endpoint (rate limited)
  app.post(
    "/upload",
    {
      config: {
        rateLimit: { max: Number(process.env.RATE_LIMIT_UPLOAD ?? 30), timeWindow: "1 minute" },
      },
    },
    async () => ({ ok: true, note: "placeholder upload endpoint" }),
  );

  // placeholder share endpoint (rate limited)
  app.post(
    "/share",
    {
      config: {
        rateLimit: { max: Number(process.env.RATE_LIMIT_SHARE ?? 60), timeWindow: "1 minute" },
      },
    },
    async () => ({ ok: true, note: "placeholder share endpoint" }),
  );

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
    // handle rate-limit (safety)
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 429) {
      reply.code(429);
      return {
        error: {
          code: ErrorCodes.TOO_MANY_REQUESTS,
          message: "Too many requests",
          statusCode: 429,
          request_id: req.id,
        },
      };
    }

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
