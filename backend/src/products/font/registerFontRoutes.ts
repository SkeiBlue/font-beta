import type { FastifyInstance } from "fastify";
import crypto from "node:crypto";

import { pool } from "../../db/pool";
import { requireAdmin, requireAuth } from "../../auth/guards";
import { AppError } from "../../common/errors/AppError";
import { ErrorCodes } from "../../common/errors/errorCodes";

import { registerAnalyzeRoutes } from "./analyze/routes";

export async function registerFontRoutes(app: FastifyInstance) {
  // Analyze (stub)
  await registerAnalyzeRoutes(app);

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
    },
  );

  // List uploads
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
}
