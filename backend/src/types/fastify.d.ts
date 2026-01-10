import "fastify";
import type { JwtPayload } from "../auth/jwt";

declare module "fastify" {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}
