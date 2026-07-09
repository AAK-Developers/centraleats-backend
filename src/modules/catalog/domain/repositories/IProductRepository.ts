import { Product } from "../entities/Product";

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  listActive(): Promise<Product[]>;
  listByVendorId(vendorId: string): Promise<Product[]>;
  listWithFilters(filters: { vendorId?: string; isAvailable?: boolean; search?: string; skip?: number; take?: number }): Promise<{ data: (Product & { vendorName: string })[]; total: number }>;
  create(product: Product): Promise<Product>;
  update(id: string, data: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>): Promise<Product>;
}
