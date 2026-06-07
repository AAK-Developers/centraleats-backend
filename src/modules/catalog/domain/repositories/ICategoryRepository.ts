import { Category } from "../entities/Category";

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  listActive(): Promise<Category[]>;
  create(category: Omit<Category, "id" | "createdAt" | "updatedAt">): Promise<Category>;
  update(id: string, data: Partial<Omit<Category, "id" | "createdAt" | "updatedAt">>): Promise<Category>;
}
