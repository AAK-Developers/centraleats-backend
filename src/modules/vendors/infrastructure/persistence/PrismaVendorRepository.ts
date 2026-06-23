import { prisma } from "../../../../infrastructure/database/prismaClient";
import { Vendor } from "../../domain/entities/Vendor";
import { IVendorRepository } from "../../domain/repositories/IVendorRepository";

export class PrismaVendorRepository implements IVendorRepository {
  private toDomain(prismaVendor: any): Vendor {
    return Vendor.reconstitute(
      prismaVendor.id,
      prismaVendor.name,
      prismaVendor.description,
      prismaVendor.location,
      prismaVendor.phone,
      prismaVendor.logoUrl,
      prismaVendor.openingTime,
      prismaVendor.closingTime,
      prismaVendor.isActive,
      prismaVendor.ownerId,
      prismaVendor.createdAt,
      prismaVendor.updatedAt
    );
  }

  async findById(id: string): Promise<Vendor | null> {
    const prismaVendor = await prisma.vendor.findUnique({
      where: { id },
    });
    return prismaVendor ? this.toDomain(prismaVendor) : null;
  }

  // Used by CreateProductUseCase to resolve vendor from authenticated user
  // This is the BOLA/IDOR fix: vendorId is never trusted from the client body.
  async findByOwnerId(ownerId: string): Promise<Vendor | null> {
    const prismaVendor = await prisma.vendor.findUnique({
      where: { ownerId },
    });
    return prismaVendor ? this.toDomain(prismaVendor) : null;
  }

  async listActive(): Promise<Vendor[]> {
    const prismaVendors = await prisma.vendor.findMany({
      where: { isActive: true },
    });
    return prismaVendors.map((v: any) => this.toDomain(v));
  }

  async create(vendor: Vendor): Promise<Vendor> {
    const prismaVendor = await prisma.vendor.create({
      data: {
        id: vendor.id,
        name: vendor.name,
        description: vendor.description,
        location: vendor.location,        // Required string (NOT NULL in schema v3.0)
        phone: vendor.phone,              // Required string (NOT NULL in schema v3.0)
        logoUrl: vendor.logoUrl,
        openingTime: vendor.openingTime,  // Required string HH:mm (NOT NULL in schema v3.0)
        closingTime: vendor.closingTime,  // Required string HH:mm (NOT NULL in schema v3.0)
        isActive: vendor.isActive,
        ownerId: vendor.ownerId,
      },
    });
    return this.toDomain(prismaVendor);
  }

  async update(id: string, data: Partial<Omit<Vendor, "id" | "createdAt" | "updatedAt">>): Promise<Vendor> {
    const prismaVendor = await prisma.vendor.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        // Only include required fields if explicitly provided (Partial update pattern)
        ...(data.location !== undefined && { location: data.location }),
        ...(data.phone !== undefined && { phone: data.phone }),
        logoUrl: data.logoUrl,
        ...(data.openingTime !== undefined && { openingTime: data.openingTime }),
        ...(data.closingTime !== undefined && { closingTime: data.closingTime }),
        isActive: data.isActive,
        ownerId: data.ownerId,
      },
    });
    return this.toDomain(prismaVendor);
  }
}
