import { Router } from "express";

import { CreateOrderController } from "../controllers/CreateOrderController";
import { requireAuth } from "../../../../../shared/middlewares/requireAuth";
import { requireRole } from "../../../../../shared/middlewares/requireRole";

export const buildOrderRoutes = (createOrderController: CreateOrderController) => {
  const router = Router();

  router.post("/", requireAuth, requireRole(["STUDENT", "ADMIN"]), createOrderController.handle);

  return router;
};
