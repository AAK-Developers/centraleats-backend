import { Request, Response } from "express";
import { PrismaCategoryRepository } from "../../../infrastructure/persistence/PrismaCategoryRepository";
import { Category } from "../../../domain/entities/Category";

/**
 * Serializes a Category domain entity to a plain JSON-safe response object.
 */
function serializeCategory(category: Category) {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    isActive: category.isActive,
  };
}

export class GetCategoriesController {
  private readonly categoryRepository = new PrismaCategoryRepository();

  async handle(_req: Request, res: Response): Promise<void> {
    try {
      const categories = await this.categoryRepository.listActive();

      res.status(200).json({
        success: true,
        data: categories.map(serializeCategory),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }
}
