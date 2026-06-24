import { Request, Response } from "express";
import { PrismaProductRepository } from "../../../infrastructure/persistence/PrismaProductRepository";
import { Product } from "../../../domain/entities/Product";

/**
 * Serializes a Product domain entity to a plain JSON-safe response object.
 * Critically: unpacks Money VO → price.value (Int centavos) per API contract.
 */
function serializeProduct(product: Product) {
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
  };
}

export class GetProductsController {
  private readonly productRepository = new PrismaProductRepository();

  async handle(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.query.vendorId as string | undefined;
      let products: Product[];

      if (vendorId) {
        products = await this.productRepository.listByVendorId(vendorId);
      } else {
        products = await this.productRepository.listActive();
      }

      res.status(200).json({
        success: true,
        data: products.map(serializeProduct),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }
}
