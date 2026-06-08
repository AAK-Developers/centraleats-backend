import { prisma } from "../../../../infrastructure/database/prismaClient";
import { Category } from "../../domain/entities/Category";
import { ICategoryRepository } from "../../domain/repositories/ICategoryRepository";

export class PrismaCategoryRepository implements ICategoryRepository {
  private toDomain(prismaCategory: any): Category {
    return new Category(
      prismaCategory.id,
      prismaCategory.name,
      prismaCategory.isActive,
      prismaCategory.createdAt,
      prismaCategory.updatedAt
    );
  }

  async findById(id: string): Promise<Category | null> {
    const prismaCategory = await prisma.category.findUnique({
      where: { id },
    });
    return prismaCategory ? this.toDomain(prismaCategory) : null;
  }

  async listActive(): Promise<Category[]> {
    const prismaCategories = await prisma.category.findMany({
      where: { isActive: true },
    });
    return prismaCategories.map((c: any) => this.toDomain(c));
  }

  async create(category: Omit<Category, "id" | "createdAt" | "updatedAt">): Promise<Category> {
    const prismaCategory = await prisma.category.create({
      data: {
        name: category.name,
        isActive: category.isActive,
      },
    });
    return this.toDomain(prismaCategory);
  }

  async update(id: string, data: Partial<Omit<Category, "id" | "createdAt" | "updatedAt">>): Promise<Category> {
    const prismaCategory = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        isActive: data.isActive,
      },
    });
    return this.toDomain(prismaCategory);
  }
}
