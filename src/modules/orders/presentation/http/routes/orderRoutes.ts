import { Router } from "express";

import { CreateOrderController } from "../controllers/CreateOrderController";
import { GetVendorOrdersController } from "../controllers/GetVendorOrdersController";
import { UpdateOrderStatusController } from "../controllers/UpdateOrderStatusController";
import { requireAuth } from "../../../../../shared/middlewares/requireAuth";
import { requireRole } from "../../../../../shared/middlewares/requireRole";

export const buildOrderRoutes = (
  createOrderController: CreateOrderController,
  getVendorOrdersController: GetVendorOrdersController,
  updateOrderStatusController: UpdateOrderStatusController
) => {
  const router = Router();

  router.post("/", requireAuth, requireRole(["STUDENT", "ADMIN"]), createOrderController.handle);
  router.get("/vendor", requireAuth, requireRole(["VENDOR"]), getVendorOrdersController.handle);
  router.patch("/:id/status", requireAuth, updateOrderStatusController.handle);

  return router;
};
