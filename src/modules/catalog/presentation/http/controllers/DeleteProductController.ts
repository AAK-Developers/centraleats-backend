import { Request, Response, NextFunction } from "express";
import { DeleteProductUseCase } from "../../../application/use-cases/DeleteProductUseCase";
import { AppError } from "../../../../../shared/errors/AppError";

export class DeleteProductController {
  constructor(private readonly deleteProductUseCase: DeleteProductUseCase) {}

  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const clerkId = req.auth?.userId;

      if (!clerkId) {
        throw new AppError("Authentication required to delete products", 401);
      }

      await this.deleteProductUseCase.execute({
        id,
        clerkId,
      });

      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
