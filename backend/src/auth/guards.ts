import type { FastifyRequest } from "fastify";
import { verifyAccessToken } from "./jwt";
import { AppError } from "../common/errors/AppError";
import { ErrorCodes } from "../common/errors/errorCodes";

export async function requireAuth(req: FastifyRequest) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, 401, "Missing bearer token");
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = await verifyAccessToken(token);
    req.user = payload;
  } catch {
    throw new AppError(ErrorCodes.UNAUTHORIZED, 401, "Invalid token");
  }
}

export async function requireAdmin(req: FastifyRequest) {
  await requireAuth(req);
  if (req.user?.role !== "admin") {
    throw new AppError(ErrorCodes.FORBIDDEN, 403, "Admin only");
  }
}
