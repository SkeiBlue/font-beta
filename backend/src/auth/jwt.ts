import { SignJWT, jwtVerify } from "jose";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing in .env");
  return new TextEncoder().encode(secret);
}

export type JwtPayload = {
  sub: string; // user id
  role: string; // user role
  email: string;
};

export async function signAccessToken(payload: JwtPayload) {
  const secret = getSecret();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyAccessToken(token: string) {
  const secret = getSecret();
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as JwtPayload;
}
