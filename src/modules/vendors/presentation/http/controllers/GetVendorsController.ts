import { Request, Response } from "express";
import { PrismaVendorRepository } from "../../../infrastructure/persistence/PrismaVendorRepository";

export class GetVendorsController {
  private readonly vendorRepository = new PrismaVendorRepository();

  async handle(_req: Request, res: Response): Promise<void> {
    try {
      const vendors = await this.vendorRepository.listActive();
      res.status(200).json(vendors);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }
}
