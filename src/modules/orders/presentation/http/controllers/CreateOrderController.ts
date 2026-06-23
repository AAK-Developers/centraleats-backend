import { Request, Response, NextFunction } from "express";
import { CreateOrderUseCase } from "../../../application/use-cases/CreateOrderUseCase";
import { AppError } from "../../../../../shared/errors/AppError";
import { validateRequestBody } from "../../../../../shared/validation/validateSchema";
import { createOrderSchema } from "../schemas/order.schemas";

export class CreateOrderController {
  constructor(private readonly createOrderUseCase: CreateOrderUseCase) {}

  handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = validateRequestBody(createOrderSchema, req);
      const clerkId = req.auth?.userId;

      if (!clerkId) {
        throw new AppError("Authentication required to place an order", 401);
      }

      const order = await this.createOrderUseCase.execute({
        clerkId,                          // Server-resolved from JWT (never from body)
        vendorId: validatedData.vendorId,
        notes: validatedData.notes,
        items: validatedData.items,
      });

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };
}
