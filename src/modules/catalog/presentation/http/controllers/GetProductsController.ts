import { Request, Response, NextFunction } from "express";
import { PrismaProductRepository } from "../../../infrastructure/persistence/PrismaProductRepository";
import { Product } from "../../../domain/entities/Product";
import { JSend } from "../../../../../shared/utils/JSend";

/**
 * Serializes a Product domain entity to a plain JSON-safe response object.
 * Critically: unpacks Money VO → price.value (Int centavos) per API contract.
 */
function serializeProduct(product: Product & { vendorName: string }) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price.value,      // Int (centavos). e.g. 350 = $3.50
    stock: product.stock,
    imageUrl: product.imageUrl,
    isAvailable: product.isAvailable,
    isActive: product.isActive,
    vendorId: product.vendorId,
    categoryId: product.categoryId,
    vendorName: product.vendorName,
  };
}

export class GetProductsController {
  private readonly productRepository = new PrismaProductRepository();

  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.query.vendorId as string | undefined;
      const availableParam = req.query.available as string | undefined;
      const search = (req.query.search || req.query.q) as string | undefined;
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const skip = (page - 1) * limit;

      let isAvailable: boolean | undefined = undefined;
      if (availableParam === "true") isAvailable = true;
      if (availableParam === "false") isAvailable = false;

      const { data, total } = await this.productRepository.listWithFilters({
        vendorId,
        isAvailable,
        search,
        skip,
        take: limit,
      });

      JSend.success(res, 200, data.map(serializeProduct), "Productos obtenidos correctamente", {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error: any) {
      next(error);
    }
  }
}
