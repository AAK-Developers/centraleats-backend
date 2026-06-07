import { Request, Response } from "express";
import { PrismaProductRepository } from "../../../infrastructure/persistence/PrismaProductRepository";

export class GetProductsController {
  private readonly productRepository = new PrismaProductRepository();

  async handle(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.query.vendorId as string | undefined;
      let products;
      
      if (vendorId) {
        products = await this.productRepository.listByVendorId(vendorId);
      } else {
        products = await this.productRepository.listActive();
      }
      
      res.status(200).json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }
}
