import "fastify";
import type { JwtPayload } from "../auth/jwt.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}
