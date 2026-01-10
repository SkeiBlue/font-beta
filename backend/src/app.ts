import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";

import { pool } from "./db/pool";
import { registerRateLimit } from "./plugins/rateLimit";

import * as AuthRoutesModule from "./auth/routes";

import { AppError } from "./common/errors/AppError";
import { ErrorCodes } from "./common/errors/errorCodes";

import { registerProducts } from "./core/products/registerProducts";
import { fontProduct } from "./products/font/index";

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

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
    disableRequestLogging: true,
  });

  // x-request-id sur toutes les réponses
  app.addHook("onRequest", async (req, reply) => {
    reply.header("x-request-id", req.id);
  });

  // Plugins
  await app.register(cors, { origin: true, credentials: true });
  await registerRateLimit(app);
  await app.register(multipart, {
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
  await pickAuthRegister()(app);

  // Produits SaaS (0.8) : FONT est branché ici, sans changer les URLs.
  await registerProducts(app, [fontProduct]);

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
