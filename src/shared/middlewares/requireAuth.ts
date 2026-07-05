import { NextFunction, Request, Response } from "express";
import { clerkTokenVerifier } from "../../infrastructure/external-services/clerk/ClerkTokenVerifier";
import { AppError } from "../errors/AppError";

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError("Missing authorization header", 401);
    }

    if (!authHeader.startsWith("Bearer ")) {
      throw new AppError(
        "Invalid authorization format. Expected: Bearer <token>",
        401
      );
    }

    const token = authHeader.split(" ")[1];
    console.log("[DEBUG] Token recibido:", token?.substring(0, 50), "... length:", token?.length);
    if (!token || token.trim() === "") {
      throw new AppError("Missing token", 401);
    }

    const authContext = await clerkTokenVerifier.verify(token);

    req.auth = authContext;

    next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Authentication middleware error:", error);
    next(error);
  }
};
