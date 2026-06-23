import { Product } from "../entities/Product";

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  listActive(): Promise<Product[]>;
  listByVendorId(vendorId: string): Promise<Product[]>;
  create(product: Product): Promise<Product>;
  update(id: string, data: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>): Promise<Product>;
}
