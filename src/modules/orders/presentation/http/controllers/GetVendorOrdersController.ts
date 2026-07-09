import { JSend } from "../../../../../shared/utils/JSend";
import { Request, Response, NextFunction } from "express";
import { GetVendorOrdersUseCase } from "../../../application/use-cases/GetVendorOrdersUseCase";
import { AppError } from "../../../../../shared/errors/AppError";

export class GetVendorOrdersController {
  constructor(private readonly getVendorOrdersUseCase: GetVendorOrdersUseCase) {}

  handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendorId = req.query.vendorId as string;
      if (!vendorId) {
        throw new AppError("vendorId query parameter is required", 400);
      }

      const orders = await this.getVendorOrdersUseCase.execute(vendorId);

      JSend.success(res, 200, orders);
    } catch (error) {
      next(error);
    }
  };
}
