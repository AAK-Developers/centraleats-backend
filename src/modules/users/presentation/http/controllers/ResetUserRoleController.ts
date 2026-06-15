import { Request, Response, NextFunction } from "express";
import { ResetUserRoleUseCase } from "../../../application/use-cases/ResetUserRoleUseCase";
import { AppError } from "../../../../../shared/errors/AppError";

export class ResetUserRoleController {
  constructor(private readonly resetUserRoleUseCase: ResetUserRoleUseCase) {}

  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clerkId = req.auth?.userId;

      if (!clerkId) {
        throw new AppError("Authentication required to reset user role", 401);
      }

      const user = await this.resetUserRoleUseCase.execute(clerkId);

      res.status(200).json({
        success: true,
        message: "User role reset successfully. Clerk metadata cleared.",
        data: {
          id: user.id,
          clerkId: user.clerkId,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
