import { Request, Response, NextFunction } from "express";
import { RegisterVendorUseCase } from "../../../application/use-cases/RegisterVendorUseCase";
import { AppError } from "../../../../../shared/errors/AppError";

export class RegisterVendorController {
  constructor(private readonly registerVendorUseCase: RegisterVendorUseCase) {}

  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description, location, phone } = req.body;
      const clerkId = req.auth?.userId;

      if (!clerkId) {
        throw new AppError("Authentication required to register a restaurant", 401);
      }

      if (!name) {
        throw new AppError("Restaurant name is required", 400);
      }

      const vendor = await this.registerVendorUseCase.execute({
        clerkId,
        name,
        description,
        location,
        phone,
      });

      res.status(201).json({
        success: true,
        message: "Restaurant registered successfully",
        data: {
          id: vendor.id,
          name: vendor.name,
          description: vendor.description,
          location: vendor.location,
          phone: vendor.phone,
          isActive: vendor.isActive,
          ownerId: vendor.ownerId,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
