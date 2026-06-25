import { Router } from "express";

import { CreateOrderUseCase } from "./application/use-cases/CreateOrderUseCase";
import { CreateOrderController } from "./presentation/http/controllers/CreateOrderController";
import { buildOrderRoutes } from "./presentation/http/routes/orderRoutes";
import { PrismaOrderRepository } from "./infrastructure/persistence/PrismaOrderRepository";
import { PrismaProductRepository } from "../catalog/infrastructure/persistence/PrismaProductRepository";
import { GetStudentOrderHistoryUseCase } from "./application/use-cases/GetStudentOrderHistoryUseCase";
import { GetStudentOrderHistoryController } from "./presentation/http/controllers/GetStudentOrderHistoryController";
import { requireAuth } from "../../shared/middlewares/requireAuth";

import { GetVendorOrdersUseCase } from "./application/use-cases/GetVendorOrdersUseCase";
import { GetVendorOrdersController } from "./presentation/http/controllers/GetVendorOrdersController";
import { UpdateOrderStatusUseCase } from "./application/use-cases/UpdateOrderStatusUseCase";
import { UpdateOrderStatusController } from "./presentation/http/controllers/UpdateOrderStatusController";

export const createOrdersModuleRouter = (): Router => {
  const orderRepository = new PrismaOrderRepository();
  const productRepository = new PrismaProductRepository();
  
  const createOrderUseCase = new CreateOrderUseCase(orderRepository, productRepository);
  const createOrderController = new CreateOrderController(createOrderUseCase);

  const getVendorOrdersUseCase = new GetVendorOrdersUseCase(orderRepository);
  const getVendorOrdersController = new GetVendorOrdersController(getVendorOrdersUseCase);

  const updateOrderStatusUseCase = new UpdateOrderStatusUseCase(orderRepository);
  const updateOrderStatusController = new UpdateOrderStatusController(updateOrderStatusUseCase);

  return buildOrderRoutes(createOrderController, getVendorOrdersController, updateOrderStatusController);
};

export const createStudentModuleRouter = (): Router => {
  const router = Router();
  const orderRepository = new PrismaOrderRepository();
  const getStudentOrderHistoryUseCase = new GetStudentOrderHistoryUseCase(orderRepository);
  const getStudentOrderHistoryController = new GetStudentOrderHistoryController(getStudentOrderHistoryUseCase);

  router.get("/order-history", requireAuth, (req, res, next) =>
    getStudentOrderHistoryController.handle(req, res, next)
  );

  return router;
};
