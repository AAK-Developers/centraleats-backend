import { Request, Response, NextFunction } from "express";
import { GetStudentOrdersUseCase } from "../../../application/use-cases/GetStudentOrdersUseCase";
import { AppError } from "../../../../../shared/errors/AppError";
import { OrderStatus } from "@prisma/client";

export class GetStudentOrdersController {
  constructor(
    private readonly getStudentOrdersUseCase: GetStudentOrdersUseCase
  ) {}

  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clerkId = req.auth?.userId;

      if (!clerkId) {
        throw new AppError("Authentication required to view student orders", 401);
      }

      const status = req.query.status as OrderStatus | undefined;
      const activeParam = req.query.active as string | undefined;
      
      let active: boolean | undefined = undefined;
      if (activeParam === "true") active = true;
      if (activeParam === "false") active = false;

      // Validate status belongs to OrderStatus enum if provided
      if (status && !Object.values(OrderStatus).includes(status)) {
        throw new AppError(`Invalid status: ${status}`, 400);
      }

      const orders = await this.getStudentOrdersUseCase.execute(clerkId, { status, active });

      res.status(200).json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }
}
