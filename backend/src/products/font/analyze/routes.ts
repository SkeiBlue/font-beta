import type { FastifyInstance } from "fastify";
import crypto from "node:crypto";

import { AppError } from "../../../common/errors/AppError";
import { ErrorCodes } from "../../../common/errors/errorCodes";
import { requireAuth } from "../../../auth/guards";

export async function registerAnalyzeRoutes(app: FastifyInstance) {
  app.post(
    "/analyze",
    {
      preHandler: requireAuth,
      config: { rateLimit: { max: 15, timeWindow: "1 minute" } },
    },
    async (req) => {
      if (!req.isMultipart()) {
        throw new AppError(ErrorCodes.BAD_REQUEST, 400, "Expected multipart/form-data");
      }

      const part = await req.file();
      if (!part) {
        throw new AppError(ErrorCodes.BAD_REQUEST, 400, "Missing file");
      }

      // (simple) check PDF
      const isPdf =
        part.mimetype === "application/pdf" || part.filename.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        throw new AppError(ErrorCodes.BAD_REQUEST, 400, "PDF only (application/pdf)");
      }

      let bytes = 0;
      const hash = crypto.createHash("sha256");

      for await (const chunk of part.file) {
        bytes += chunk.length;
        hash.update(chunk);
      }

      const sha256 = hash.digest("hex");
      const analysis_id = crypto.randomUUID();

      //  Stub: on branche Mistral à létape 3.2
      return {
        ok: true,
        analysis_id,
        input: {
          filename: part.filename,
          mimetype: part.mimetype,
          bytes,
          sha256,
        },
        result: {
          status: "stub",
          summary: "Analyse PDF: stub OK. Étape suivante = connexion Mistral + extraction contenu.",
        },
      };
    },
  );
}
