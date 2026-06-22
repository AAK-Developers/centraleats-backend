import { Request, Response, NextFunction } from "express";
import { RegisterUserUseCase } from "../../../application/use-cases/RegisterUserUseCase";
import { AppError } from "../../../../../shared/errors/AppError";

export class RegisterUserController {
  constructor(private readonly registerUserUseCase: RegisterUserUseCase) {}

  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role, clerkId } = req.body;

      // Extract clerkId from Clerk token payload if requireAuth was executed,
      // fallback to body if not present but sent.
      const resolvedClerkId = req.auth?.userId || clerkId;

      if (!resolvedClerkId) {
        throw new AppError("clerkId is required to register or update user", 400);
      }

      if (!role) {
        throw new AppError("role is required", 400);
      }

      const normalizedRole = role.toString().toUpperCase();

      if (normalizedRole !== "STUDENT" && normalizedRole !== "VENDOR" && normalizedRole !== "ADMIN") {
        throw new AppError("Invalid role. Expected 'student', 'vendor', or 'admin'", 400);
      }

      const user = await this.registerUserUseCase.execute({
        clerkId: resolvedClerkId,
        role: normalizedRole as "STUDENT" | "VENDOR" | "ADMIN",
        email: req.body.email,
        fullName: req.body.fullName,
        avatarUrl: req.body.avatarUrl,
      });

      res.status(200).json({
        success: true,
        message: "User role assigned successfully",
        data: {
          id: user.id,
          clerkId: user.clerkId,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
