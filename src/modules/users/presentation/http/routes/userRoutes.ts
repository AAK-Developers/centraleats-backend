import { Router } from "express";
import { RegisterUserController } from "../controllers/RegisterUserController";
import { RegisterUserUseCase } from "../../../application/use-cases/RegisterUserUseCase";
import { ResetUserRoleController } from "../controllers/ResetUserRoleController";
import { ResetUserRoleUseCase } from "../../../application/use-cases/ResetUserRoleUseCase";
import { PrismaUserRepository } from "../../../infrastructure/persistence/PrismaUserRepository";
import { requireAuth } from "../../../../../shared/middlewares/requireAuth";

export const buildUserRoutes = (): Router => {
  const router = Router();

  const userRepository = new PrismaUserRepository();
  
  const registerUserUseCase = new RegisterUserUseCase(userRepository);
  const registerUserController = new RegisterUserController(registerUserUseCase);

  const resetUserRoleUseCase = new ResetUserRoleUseCase(userRepository);
  const resetUserRoleController = new ResetUserRoleController(resetUserRoleUseCase);

  // POST /api/users - Apply requireAuth to register or overwrite user role
  router.post("/", requireAuth, (req, res, next) => registerUserController.handle(req, res, next));

  // DELETE /api/users/role - Clear role in database (reset to STUDENT) and clear Clerk publicMetadata
  router.delete("/role", requireAuth, (req, res, next) => resetUserRoleController.handle(req, res, next));

  return router;
};
