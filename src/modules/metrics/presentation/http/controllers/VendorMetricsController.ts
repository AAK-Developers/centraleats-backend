import { JSend } from "../../../../../shared/utils/JSend";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../../../../../shared/errors/AppError";
import { PrismaVendorRepository } from "../../../../vendors/infrastructure/persistence/PrismaVendorRepository";
import { GetVendorMetricsSummaryUseCase } from "../../../application/use-cases/GetVendorMetricsSummaryUseCase";
import { GetVendorOrdersByStatusUseCase } from "../../../application/use-cases/GetVendorOrdersByStatusUseCase";
import { GetVendorSalesTimeseriesUseCase } from "../../../application/use-cases/GetVendorSalesTimeseriesUseCase";
import { GetVendorTopProductsUseCase } from "../../../application/use-cases/GetVendorTopProductsUseCase";
import { GetVendorTopCustomersUseCase } from "../../../application/use-cases/GetVendorTopCustomersUseCase";
import { GetVendorRecentOrdersUseCase } from "../../../application/use-cases/GetVendorRecentOrdersUseCase";

export class VendorMetricsController {
  private vendorRepository = new PrismaVendorRepository();

  constructor(
    private readonly summaryUseCase: GetVendorMetricsSummaryUseCase,
    private readonly ordersByStatusUseCase: GetVendorOrdersByStatusUseCase,
    private readonly salesTimeseriesUseCase: GetVendorSalesTimeseriesUseCase,
    private readonly topProductsUseCase: GetVendorTopProductsUseCase,
    private readonly topCustomersUseCase: GetVendorTopCustomersUseCase,
    private readonly recentOrdersUseCase: GetVendorRecentOrdersUseCase
  ) {
    this.handleSummary = this.handleSummary.bind(this);
    this.handleOrdersByStatus = this.handleOrdersByStatus.bind(this);
    this.handleSalesTimeseries = this.handleSalesTimeseries.bind(this);
    this.handleTopProducts = this.handleTopProducts.bind(this);
    this.handleTopCustomers = this.handleTopCustomers.bind(this);
    this.handleRecentOrders = this.handleRecentOrders.bind(this);
  }

  private async getVendor(req: Request) {
    const userId = req.auth?.user?.id;
    if (!userId) {
      throw new AppError("Unauthorized. User not found in auth context.", 401);
    }
    const vendor = await this.vendorRepository.findByOwnerId(userId);
    return vendor;
  }

  async handleSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendor = await this.getVendor(req);
      if (!vendor) {
        JSend.error(res, 404, "No restaurant found for this user");
        return;
      }

      const range = (req.query.range as string) || "today";
      const data = await this.summaryUseCase.execute(vendor.id, range);

      JSend.success(res, 200, data, "Summary metrics fetched");
    } catch (error) {
      next(error);
    }
  }

  async handleOrdersByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendor = await this.getVendor(req);
      if (!vendor) {
        JSend.error(res, 404, "No restaurant found for this user");
        return;
      }

      const range = (req.query.range as string) || "today";
      const data = await this.ordersByStatusUseCase.execute(vendor.id, range);

      JSend.success(res, 200, data, "Orders by status fetched");
    } catch (error) {
      next(error);
    }
  }

  async handleSalesTimeseries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendor = await this.getVendor(req);
      if (!vendor) {
        JSend.error(res, 404, "No restaurant found for this user");
        return;
      }

      const range = (req.query.range as string) || "today";
      const bucket = (req.query.bucket as string) === "day" ? "day" : "hour";
      const data = await this.salesTimeseriesUseCase.execute(vendor.id, range, bucket);

      JSend.success(res, 200, data, "Sales timeseries fetched");
    } catch (error) {
      next(error);
    }
  }

  async handleTopProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendor = await this.getVendor(req);
      if (!vendor) {
        JSend.error(res, 404, "No restaurant found for this user");
        return;
      }

      const range = (req.query.range as string) || "7d";
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const data = await this.topProductsUseCase.execute(vendor.id, range, limit);

      JSend.success(res, 200, data, "Top products fetched");
    } catch (error) {
      next(error);
    }
  }

  async handleTopCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendor = await this.getVendor(req);
      if (!vendor) {
        JSend.error(res, 404, "No restaurant found for this user");
        return;
      }

      const range = (req.query.range as string) || "30d";
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const data = await this.topCustomersUseCase.execute(vendor.id, range, limit);

      JSend.success(res, 200, data, "Top customers fetched");
    } catch (error) {
      next(error);
    }
  }

  async handleRecentOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendor = await this.getVendor(req);
      if (!vendor) {
        JSend.error(res, 404, "No restaurant found for this user");
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const data = await this.recentOrdersUseCase.execute(vendor.id, limit);

      JSend.success(res, 200, data, "Recent orders fetched");
    } catch (error) {
      next(error);
    }
  }
}
