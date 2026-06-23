import { Request, Response } from "express";
import { PrismaVendorRepository } from "../../../infrastructure/persistence/PrismaVendorRepository";
import { Vendor } from "../../../domain/entities/Vendor";

/**
 * Serializes a Vendor domain entity to a plain JSON-safe response object.
 * Consistent API contract: { success, data } envelope.
 */
function serializeVendor(vendor: Vendor) {
  return {
    id: vendor.id,
    name: vendor.name,
    description: vendor.description,
    location: vendor.location,
    phone: vendor.phone,
    logoUrl: vendor.logoUrl,
    openingTime: vendor.openingTime,
    closingTime: vendor.closingTime,
    isActive: vendor.isActive,
    ownerId: vendor.ownerId,
  };
}

export class GetVendorsController {
  private readonly vendorRepository = new PrismaVendorRepository();

  async handle(_req: Request, res: Response): Promise<void> {
    try {
      const vendors = await this.vendorRepository.listActive();

      res.status(200).json({
        success: true,
        data: vendors.map(serializeVendor),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }
}
