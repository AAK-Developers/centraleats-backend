import { verifyToken } from "@clerk/backend";
import { env } from "../../../config/env";
import { AppError } from "../../../shared/errors/AppError";
import { AuthContext } from "../../../shared/types/auth";

export class ClerkTokenVerifier {
  async verify(token: string): Promise<AuthContext> {
    try {
      const payload = await verifyToken(token, {
        secretKey: env.CLERK_SECRET_KEY,
        clockSkewInMs: 60000,
      });

      if (!payload || !payload.sub) {
        throw new AppError("Invalid token payload", 401);
      }

      return {
        userId: payload.sub,
      };
    } catch (err: any) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError("Invalid or expired token", 401);
    }
  }
}

export const clerkTokenVerifier = new ClerkTokenVerifier();