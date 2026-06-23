import { Request, Response, NextFunction } from "express";
import { RegisterVendorUseCase } from "../../../application/use-cases/RegisterVendorUseCase";
import { AppError } from "../../../../../shared/errors/AppError";
import { validateRequestBody } from "../../../../../shared/validation/validateSchema";
import { registerVendorSchema } from "../schemas/vendor.schemas";

export class RegisterVendorController {
  constructor(private readonly registerVendorUseCase: RegisterVendorUseCase) {}

  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = validateRequestBody(registerVendorSchema, req);
      const clerkId = req.auth?.userId;
      const imageFile = req.file;

      if (!clerkId) {
        throw new AppError("Authentication required to register a restaurant", 401);
      }

      const vendor = await this.registerVendorUseCase.execute({
        clerkId,
        name: validatedData.name,
        description: validatedData.description,
        location: validatedData.location,
        phone: validatedData.phone,
        openingTime: validatedData.openingTime,
        closingTime: validatedData.closingTime,
        image: imageFile ? {
          buffer: imageFile.buffer,
          originalname: imageFile.originalname,
          mimetype: imageFile.mimetype
        } : undefined
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
          logoUrl: vendor.logoUrl,
          openingTime: vendor.openingTime,
          closingTime: vendor.closingTime,
          isActive: vendor.isActive,
          ownerId: vendor.ownerId,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
