import { Request, Response, NextFunction } from "express";
import { PrismaUserRepository } from "../../modules/users/infrastructure/persistence/PrismaUserRepository";

// Instanciamos el repositorio según las directrices de usar únicamente PrismaUserRepository
const userRepository = new PrismaUserRepository();

type AllowedRole = "ADMIN" | "VENDOR" | "STUDENT";

export const requireRole = (allowedRoles: AllowedRole[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth || !req.auth.userId) {
        res.status(401).json({ error: "Unauthorized: Missing authentication context" });
        return;
      }

      const clerkId = req.auth.userId;

      // Resolución de identidad mediante repositorio de dominio
      const user = await userRepository.findByClerkId(clerkId);

      // Caso 2: Usuario no existe localmente
      if (!user) {
        res.status(403).json({ error: "Forbidden: User profile not found" });
        return;
      }

      // Caso 3: Usuario tiene rol pendiente
      if (user.role === "PENDING") {
        res.status(403).json({ 
          error: "Forbidden: Role not assigned. Please complete onboarding.",
          code: "ROLE_PENDING"
        });
        return;
      }

      // Caso 3: Usuario inactivo
      if (!user.isActive) {
        res.status(403).json({ error: "Forbidden: Account is deactivated" });
        return;
      }

      // Caso 4: Rol insuficiente
      if (!allowedRoles.includes(user.role)) {
        res.status(403).json({ error: "Forbidden: Insufficient permissions" });
        return;
      }

      // Caso 5: Autorización exitosa - Enriquecimiento del request
      req.auth.user = user;

      next();
    } catch (error) {
      console.error("[requireRole] Error during authorization:", error);
      res.status(500).json({ error: "Internal server error during authorization" });
    }
  };
};
