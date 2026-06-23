import { Request, Response, NextFunction } from "express";
import { CreateProductUseCase } from "../../../application/use-cases/CreateProductUseCase";
import { AppError } from "../../../../../shared/errors/AppError";
import { validateRequestBody } from "../../../../../shared/validation/validateSchema";
import { createProductSchema } from "../schemas/catalog.schemas";

export class CreateProductController {
  constructor(private readonly createProductUseCase: CreateProductUseCase) {}

  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // vendorId is NO LONGER read from req.body (BOLA/IDOR vulnerability fix).
      // The UseCase resolves the vendor internally from the authenticated clerkId.
      const validatedData = validateRequestBody(createProductSchema, req);
      const clerkId = req.auth?.userId;
      const imageFile = req.file;

      if (!clerkId) {
        throw new AppError("Authentication required to add products", 401);
      }

      const product = await this.createProductUseCase.execute({
        clerkId,
        categoryId: validatedData.categoryId,
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        stock: validatedData.stock,
        image: imageFile
          ? {
              buffer: imageFile.buffer,
              originalname: imageFile.originalname,
              mimetype: imageFile.mimetype,
            }
          : undefined,
      });

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price.value,     // Int (centavos). Frontend formats to "$3.50".
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
