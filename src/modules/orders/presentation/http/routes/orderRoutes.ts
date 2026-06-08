import { Router } from "express";

import { CreateOrderController } from "../controllers/CreateOrderController";

export const buildOrderRoutes = (createOrderController: CreateOrderController) => {
  const router = Router();

  router.post("/", createOrderController.handle);

  return router;
};
