import { JSend } from "../../../../../shared/utils/JSend";
import { Request, Response, NextFunction } from "express";
import { PrismaCategoryRepository } from "../../../infrastructure/persistence/PrismaCategoryRepository";
import { Category } from "../../../domain/entities/Category";

/**
 * Serializes a Category domain entity to a plain JSON-safe response object.
 */
function serializeCategory(category: Category) {
  return {
    id: category.id,
    name: category.name,
  };
}

export class GetCategoriesController {
  private readonly categoryRepository = new PrismaCategoryRepository();

  async handle(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await this.categoryRepository.listActive();

      JSend.success(res, 200, categories.map(serializeCategory));
    } catch (error: any) {
      next(error);
    }
  }
}
