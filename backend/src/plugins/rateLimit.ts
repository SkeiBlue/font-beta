import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";
import { ErrorCodes } from "../common/errors/errorCodes";

export async function registerRateLimit(app: FastifyInstance) {
  const globalMax = Number(process.env.RATE_LIMIT_GLOBAL ?? 200);

  await app.register(rateLimit, {
    global: false,
    max: globalMax,
    timeWindow: "1 minute",
    errorResponseBuilder: (req, context) => {
      return {
        //  IMPORTANT: le plugin attend statusCode ici
        statusCode: 429,
        // (optionnel) champs "classiques" du plugin
        error: "Too Many Requests",
        message: `Rate limit exceeded, retry in ${context.after}`,

        //  notre format standard
        data: {
          error: {
            code: ErrorCodes.TOO_MANY_REQUESTS,
            message: "Too many requests",
            statusCode: 429,
            request_id: req.id,
            details: { retry_in: context.after },
          },
        },
      };
    },
  });
}
