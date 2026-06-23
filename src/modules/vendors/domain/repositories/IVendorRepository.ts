import { Vendor } from "../entities/Vendor";

export interface IVendorRepository {
  findById(id: string): Promise<Vendor | null>;
  findByOwnerId(ownerId: string): Promise<Vendor | null>;
  listActive(): Promise<Vendor[]>;
  create(vendor: Vendor): Promise<Vendor>;
  update(id: string, data: Partial<Omit<Vendor, "id" | "createdAt" | "updatedAt">>): Promise<Vendor>;
}
