import { Request, Response } from "express";
import { PrismaCategoryRepository } from "../../../infrastructure/persistence/PrismaCategoryRepository";

export class GetCategoriesController {
  private readonly categoryRepository = new PrismaCategoryRepository();

  async handle(_req: Request, res: Response): Promise<void> {
    try {
      const categories = await this.categoryRepository.listActive();
      res.status(200).json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }
}
