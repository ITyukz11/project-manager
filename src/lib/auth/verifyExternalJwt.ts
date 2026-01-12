// lib/auth/verifyExternalJwt.ts
import jwt from "jsonwebtoken";

export interface ExternalJwtPayload {
  userId: string;
  username: string;
  role?: string;
  sub: string;
}

export function verifyExternalJwt(token: string): ExternalJwtPayload {
  return jwt.verify(
    token,
    process.env.COMMISSION_JWT_SECRET!
  ) as ExternalJwtPayload;
}
