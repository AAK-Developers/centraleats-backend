import { Request, Response, NextFunction } from "express";
import { UpdateProductUseCase } from "../../../application/use-cases/UpdateProductUseCase";
import { AppError } from "../../../../../shared/errors/AppError";
import { validateRequestBody } from "../../../../../shared/validation/validateSchema";
import { updateProductSchema } from "../schemas/catalog.schemas";

export class UpdateProductController {
  constructor(private readonly updateProductUseCase: UpdateProductUseCase) {}

  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError("Product ID is required", 400);
      }

      const validatedData = validateRequestBody(updateProductSchema, req);
      const clerkId = req.auth?.userId;
      const imageFile = req.file;

      if (!clerkId) {
        throw new AppError("Authentication required to edit products", 401);
      }

      const product = await this.updateProductUseCase.execute({
        id,
        clerkId,
        categoryId: validatedData.categoryId,
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        stock: validatedData.stock,
        isAvailable: validatedData.isAvailable,
        isActive: validatedData.isActive,
        image: imageFile
          ? {
              buffer: imageFile.buffer,
              originalname: imageFile.originalname,
              mimetype: imageFile.mimetype,
            }
          : undefined,
      });

      res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price.value,     // Int (centavos)
          stock: product.stock,
          imageUrl: product.imageUrl,
          isAvailable: product.isAvailable,
          isActive: product.isActive,
          vendorId: product.vendorId,
          categoryId: product.categoryId,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
