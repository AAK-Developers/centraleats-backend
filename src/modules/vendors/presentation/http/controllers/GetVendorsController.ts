import { Request, Response, NextFunction } from "express";
import { PrismaVendorRepository } from "../../../infrastructure/persistence/PrismaVendorRepository";
import { Vendor } from "../../../domain/entities/Vendor";
import { JSend } from "../../../../../shared/utils/JSend";

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
    estimatedWaitTime: vendor.estimatedWaitTime,
    isActive: vendor.isActive,
    ownerId: vendor.ownerId,
  };
}

export class GetVendorsController {
  private readonly vendorRepository = new PrismaVendorRepository();

  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = (req.query.search || req.query.q) as string | undefined;
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const skip = (page - 1) * limit;

      const { data, total } = await this.vendorRepository.listActive({ search, skip, take: limit });

      JSend.success(res, 200, data.map(serializeVendor), "Restaurantes obtenidos correctamente", {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error: any) {
      next(error);
    }
  }
}
