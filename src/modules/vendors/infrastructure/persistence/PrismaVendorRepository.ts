import { prismaClient } from "../../../../infrastructure/database/prismaClient";
import { Vendor } from "../../domain/entities/Vendor";
import { IVendorRepository } from "../../domain/repositories/IVendorRepository";

export class PrismaVendorRepository implements IVendorRepository {
  private toDomain(prismaVendor: any): Vendor {
    return new Vendor(
      prismaVendor.id,
      prismaVendor.name,
      prismaVendor.description,
      prismaVendor.location,
      prismaVendor.phone,
      prismaVendor.isActive,
      prismaVendor.ownerId,
      prismaVendor.createdAt,
      prismaVendor.updatedAt
    );
  }

  async findById(id: string): Promise<Vendor | null> {
    const prismaVendor = await prismaClient.vendor.findUnique({
      where: { id },
    });
    return prismaVendor ? this.toDomain(prismaVendor) : null;
  }

  async listActive(): Promise<Vendor[]> {
    const prismaVendors = await prismaClient.vendor.findMany({
      where: { isActive: true },
    });
    return prismaVendors.map(v => this.toDomain(v));
  }

  async create(vendor: Omit<Vendor, "id" | "createdAt" | "updatedAt">): Promise<Vendor> {
    const prismaVendor = await prismaClient.vendor.create({
      data: {
        name: vendor.name,
        description: vendor.description,
        location: vendor.location,
        phone: vendor.phone,
        isActive: vendor.isActive,
        ownerId: vendor.ownerId,
      },
    });
    return this.toDomain(prismaVendor);
  }

  async update(id: string, data: Partial<Omit<Vendor, "id" | "createdAt" | "updatedAt">>): Promise<Vendor> {
    const prismaVendor = await prismaClient.vendor.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        location: data.location,
        phone: data.phone,
        isActive: data.isActive,
        ownerId: data.ownerId,
      },
    });
    return this.toDomain(prismaVendor);
  }
}
