import type { FastifyInstance } from "fastify";
import { pool } from "../db/pool.js";
import { AppError } from "../common/errors/AppError.js";
import { ErrorCodes } from "../common/errors/errorCodes.js";
import { verifyPassword } from "./password.js";
import { signAccessToken } from "./jwt.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (req) => {
    const body = req.body as { email?: string; password?: string };

    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      throw new AppError(ErrorCodes.BAD_REQUEST, 400, "email and password required");
    }

    const res = await pool.query(
      'SELECT id, email, password_hash, role FROM public."users" WHERE email = $1 LIMIT 1',
      [email],
    );

    const user = res.rows[0];
    if (!user) throw new AppError(ErrorCodes.UNAUTHORIZED, 401, "Invalid credentials");

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) throw new AppError(ErrorCodes.UNAUTHORIZED, 401, "Invalid credentials");

    const token = await signAccessToken({ sub: user.id, role: user.role, email: user.email });

    return { access_token: token };
  });
}
