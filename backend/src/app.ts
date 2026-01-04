import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import crypto from "node:crypto";

import { pool } from "./db/pool.js";
import { registerRateLimit } from "./plugins/rateLimit.js";

import { requireAdmin, requireAuth } from "./auth/guards.js";
import * as AuthRoutesModule from "./auth/routes.js";

import { AppError } from "./common/errors/AppError.js";
import { ErrorCodes } from "./common/errors/errorCodes.js";

type RegisterRoutesFn = (app: FastifyInstance) => void | Promise<void>;

function pickAuthRegister(): RegisterRoutesFn {
  const mod: Record<string, unknown> = AuthRoutesModule;

  const preferred = ["registerAuthRoutes", "registerRoutes", "register", "routes", "default"];
  for (const name of preferred) {
    const v = mod[name];
    if (typeof v === "function") return v as RegisterRoutesFn;
  }

  const anyFn = Object.entries(mod).find(([, v]) => typeof v === "function");
  if (anyFn) return anyFn[1] as RegisterRoutesFn;

  throw new Error(
    `auth/routes.ts: aucun export function trouvé. Exports: ${Object.keys(mod).join(", ")}`,
  );
}

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: true,
    disableRequestLogging: true,
  });

  // x-request-id sur toutes les réponses
  app.addHook("onRequest", async (req, reply) => {
    reply.header("x-request-id", req.id);
  });

  // CORS
  app.register(cors, { origin: true, credentials: true });

  // Rate limit
  registerRateLimit(app);

  // Multipart
  app.register(multipart, {
    limits: { files: 1, fileSize: 10 * 1024 * 1024 },
  });

  // Health
  app.get("/health", async () => ({ ok: true }));

  app.get("/health/db", async () => {
    try {
      await pool.query("SELECT 1");
      return { db: true };
    } catch {
      return { db: false };
    }
  });

  // Auth routes (auto-détecté)
  pickAuthRegister()(app);

  // Me
  app.get("/me", { preHandler: requireAuth }, async (req) => ({ user: req.user }));

  // Admin ping
  app.get("/admin/ping", { preHandler: [requireAuth, requireAdmin] }, async () => ({ ok: true }));

  // Upload (DB metadata)
  app.post(
    "/upload",
    { preHandler: requireAuth, config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (req) => {
      if (!req.isMultipart()) {
        throw new AppError(ErrorCodes.BAD_REQUEST, 400, "Expected multipart/form-data");
      }

      const part = await req.file();
      if (!part) {
        throw new AppError(ErrorCodes.BAD_REQUEST, 400, "Missing file");
      }

      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(ErrorCodes.UNAUTHORIZED, 401, "Missing user context");
      }

      let bytes = 0;
      const hash = crypto.createHash("sha256");

      for await (const chunk of part.file) {
        bytes += chunk.length;
        hash.update(chunk);
      }

      const sha256 = hash.digest("hex");

      try {
        const r = await pool.query<{ id: string }>(
          `INSERT INTO uploads (user_id, filename, mimetype, bytes, sha256)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [userId, part.filename, part.mimetype, bytes, sha256],
        );

        const upload_id = r.rows[0]?.id;
        if (!upload_id) throw new AppError(ErrorCodes.INTERNAL_ERROR, 500, "Upload insert failed");

        return {
          ok: true,
          upload_id,
          file: { filename: part.filename, mimetype: part.mimetype, bytes, sha256 },
        };
      } catch (err) {
        throw new AppError(ErrorCodes.INTERNAL_ERROR, 500, "Database error", {
          message: err instanceof Error ? err.message : String(err),
        });
      }
    },
  );

  //  2.3  Liste des uploads de lutilisateur
  app.get<{ Querystring: { limit?: string; offset?: string } }>(
    "/uploads",
    { preHandler: requireAuth, config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    async (req) => {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(ErrorCodes.UNAUTHORIZED, 401, "Missing user context");
      }

      const limit = Math.min(Math.max(parseInt(req.query.limit ?? "50", 10) || 50, 1), 200);
      const offset = Math.max(parseInt(req.query.offset ?? "0", 10) || 0, 0);

      const { rows } = await pool.query<{
        id: string;
        filename: string;
        mimetype: string;
        bytes: number;
        sha256: string;
        created_at: string;
      }>(
        `SELECT id, filename, mimetype, bytes, sha256, created_at
         FROM uploads
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset],
      );

      return { uploads: rows, limit, offset };
    },
  );

  // Share (stub)
  app.post(
    "/share",
    { preHandler: requireAuth, config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    async () => ({ ok: true }),
  );

  // 404
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

  // Errors
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
    return {
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: "Internal server error",
        statusCode: 500,
        request_id: req.id,
        details:
          process.env.NODE_ENV === "development"
            ? { name: err?.name, message: err?.message }
            : null,
      },
    };
  });

  return app;
}
