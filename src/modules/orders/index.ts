import { Router } from "express";

import { CreateOrderUseCase } from "./application/use-cases/CreateOrderUseCase";
import { InMemoryOrderRepository } from "./infrastructure/persistence/InMemoryOrderRepository";
import { CreateOrderController } from "./presentation/http/controllers/CreateOrderController";
import { buildOrderRoutes } from "./presentation/http/routes/orderRoutes";
import { PrismaOrderRepository } from "./infrastructure/persistence/PrismaOrderRepository";
import { GetStudentOrderHistoryUseCase } from "./application/use-cases/GetStudentOrderHistoryUseCase";
import { GetStudentOrderHistoryController } from "./presentation/http/controllers/GetStudentOrderHistoryController";
import { requireAuth } from "../../shared/middlewares/requireAuth";

export const createOrdersModuleRouter = (): Router => {
  const orderRepository = new InMemoryOrderRepository();
  const createOrderUseCase = new CreateOrderUseCase(orderRepository);
  const createOrderController = new CreateOrderController(createOrderUseCase);

  return buildOrderRoutes(createOrderController);
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
