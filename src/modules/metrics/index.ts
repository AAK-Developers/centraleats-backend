import { Router } from "express";
import { PrismaVendorMetricsRepository } from "./infrastructure/persistence/PrismaVendorMetricsRepository";
import { GetVendorMetricsSummaryUseCase } from "./application/use-cases/GetVendorMetricsSummaryUseCase";
import { GetVendorOrdersByStatusUseCase } from "./application/use-cases/GetVendorOrdersByStatusUseCase";
import { GetVendorSalesTimeseriesUseCase } from "./application/use-cases/GetVendorSalesTimeseriesUseCase";
import { GetVendorTopProductsUseCase } from "./application/use-cases/GetVendorTopProductsUseCase";
import { GetVendorTopCustomersUseCase } from "./application/use-cases/GetVendorTopCustomersUseCase";
import { GetVendorRecentOrdersUseCase } from "./application/use-cases/GetVendorRecentOrdersUseCase";
import { VendorMetricsController } from "./presentation/http/controllers/VendorMetricsController";
import { buildMetricsRoutes } from "./presentation/http/routes/metricsRoutes";

export const createMetricsModuleRouter = (): Router => {
  const metricsRepository = new PrismaVendorMetricsRepository();

  const summaryUseCase = new GetVendorMetricsSummaryUseCase(metricsRepository);
  const ordersByStatusUseCase = new GetVendorOrdersByStatusUseCase(metricsRepository);
  const salesTimeseriesUseCase = new GetVendorSalesTimeseriesUseCase(metricsRepository);
  const topProductsUseCase = new GetVendorTopProductsUseCase(metricsRepository);
  const topCustomersUseCase = new GetVendorTopCustomersUseCase(metricsRepository);
  const recentOrdersUseCase = new GetVendorRecentOrdersUseCase(metricsRepository);

  const controller = new VendorMetricsController(
    summaryUseCase,
    ordersByStatusUseCase,
    salesTimeseriesUseCase,
    topProductsUseCase,
    topCustomersUseCase,
    recentOrdersUseCase
  );

  return buildMetricsRoutes(controller);
};
