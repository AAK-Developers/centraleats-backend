import { Request, Response, NextFunction } from "express";
import { CreateProductUseCase } from "../../../application/use-cases/CreateProductUseCase";
import { AppError } from "../../../../../shared/errors/AppError";

export class CreateProductController {
  constructor(private readonly createProductUseCase: CreateProductUseCase) {}

  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { vendorId, categoryId, name, description, price, stock } = req.body;
      const clerkId = req.auth?.userId;
      const imageFile = req.file;

      if (!clerkId) {
        throw new AppError("Authentication required to add products", 401);
      }

      if (!vendorId || !categoryId || !name || !price) {
        throw new AppError("Missing required fields: vendorId, categoryId, name, price", 400);
      }

      const product = await this.createProductUseCase.execute({
        clerkId,
        vendorId,
        categoryId,
        name,
        description,
        price: Number(price),
        stock: stock ? Number(stock) : undefined,
        image: imageFile ? {
          buffer: imageFile.buffer,
          originalname: imageFile.originalname,
          mimetype: imageFile.mimetype
        } : undefined
      });

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
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
