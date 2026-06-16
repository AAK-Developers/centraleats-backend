import { Request, Response, NextFunction } from "express";
import { GetStudentOrderHistoryUseCase } from "../../../application/use-cases/GetStudentOrderHistoryUseCase";
import { AppError } from "../../../../../shared/errors/AppError";

export class GetStudentOrderHistoryController {
  constructor(
    private readonly getStudentOrderHistoryUseCase: GetStudentOrderHistoryUseCase
  ) {}

  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clerkId = req.auth?.userId;

      if (!clerkId) {
        throw new AppError("Authentication required to view order history", 401);
      }

      const orders = await this.getStudentOrderHistoryUseCase.execute(clerkId);

      res.status(200).json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }
}
