import { Request, Response, NextFunction } from "express";
import { PrismaUserRepository } from "../../modules/users/infrastructure/persistence/PrismaUserRepository";
import { AppError } from "../errors/AppError";

// Instanciamos el repositorio según las directrices de usar únicamente PrismaUserRepository
const userRepository = new PrismaUserRepository();

type AllowedRole = "ADMIN" | "VENDOR" | "STUDENT";

export const requireRole = (allowedRoles: AllowedRole[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth || !req.auth.userId) {
        throw new AppError("Unauthorized: Missing authentication context", 401);
      }

      const clerkId = req.auth.userId;

      // Resolución de identidad mediante repositorio de dominio
      const user = await userRepository.findByClerkId(clerkId);

      // Caso 2: Usuario no existe localmente
      if (!user) {
        throw new AppError("Forbidden: User profile not found", 403);
      }

      // Caso 3: Usuario tiene rol pendiente
      if (user.role === "PENDING") {
        throw new AppError("Forbidden: Role not assigned. Please complete onboarding.", 403);
      }

      // Caso 3: Usuario inactivo
      if (!user.isActive) {
        throw new AppError("Forbidden: Account is deactivated", 403);
      }

      // Caso 4: Rol insuficiente
      if (!allowedRoles.includes(user.role)) {
        throw new AppError("Forbidden: Insufficient permissions", 403);
      }

      // Caso 5: Autorización exitosa - Enriquecimiento del request
      req.auth.user = user;

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
        return;
      }
      console.error("[requireRole] Error during authorization:", error);
      next(new AppError("Internal server error during authorization", 500));
    }
  };
};
