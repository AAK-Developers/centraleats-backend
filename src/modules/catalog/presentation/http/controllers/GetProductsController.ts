import { Request, Response } from "express";
import { PrismaProductRepository } from "../../../infrastructure/persistence/PrismaProductRepository";
import { Product } from "../../../domain/entities/Product";

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

  async handle(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.query.vendorId as string | undefined;
      const availableParam = req.query.available as string | undefined;

      let isAvailable: boolean | undefined = undefined;
      if (availableParam === "true") isAvailable = true;
      if (availableParam === "false") isAvailable = false;

      const products = await this.productRepository.listWithFilters({
        vendorId,
        isAvailable,
      });

      res.status(200).json({
        success: true,
        data: products.map(serializeProduct),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }
}
