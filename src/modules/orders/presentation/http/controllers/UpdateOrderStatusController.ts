import { Request, Response, NextFunction } from "express";
import { UpdateOrderStatusUseCase } from "../../../application/use-cases/UpdateOrderStatusUseCase";
import { OrderStatus } from "@prisma/client";
import { AppError } from "../../../../../shared/errors/AppError";

export class UpdateOrderStatusController {
  constructor(private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase) {}

  handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { status } = req.body;

      if (!status) {
        throw new AppError("status field is required in request body", 400);
      }

      // Validate status belongs to OrderStatus enum
      if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
        throw new AppError(`Invalid status: ${status}`, 400);
      }

      const updatedOrder = await this.updateOrderStatusUseCase.execute(id, status as OrderStatus);

      res.status(200).json({
        success: true,
        message: `Order status updated to ${status}`,
        data: updatedOrder,
      });
    } catch (error) {
      next(error);
    }
  };
}
