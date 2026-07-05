import { Router } from "express";
import { VendorMetricsController } from "../controllers/VendorMetricsController";
import { requireAuth } from "../../../../../shared/middlewares/requireAuth";
import { requireRole } from "../../../../../shared/middlewares/requireRole";

export const buildMetricsRoutes = (controller: VendorMetricsController): Router => {
  const router = Router();

  // All vendor metrics endpoints are protected by auth and VENDOR role
  router.use(requireAuth);
  router.use(requireRole(["VENDOR"]));

  router.get("/vendor/summary", controller.handleSummary);
  router.get("/vendor/orders-by-status", controller.handleOrdersByStatus);
  router.get("/vendor/sales-timeseries", controller.handleSalesTimeseries);
  router.get("/vendor/top-products", controller.handleTopProducts);
  router.get("/vendor/top-customers", controller.handleTopCustomers);
  router.get("/vendor/recent-orders", controller.handleRecentOrders);

  return router;
};
