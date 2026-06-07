import { Router } from "express";

import { CreateOrderUseCase } from "./application/use-cases/CreateOrderUseCase";
import { InMemoryOrderRepository } from "./infrastructure/persistence/InMemoryOrderRepository";
import { CreateOrderController } from "./presentation/http/controllers/CreateOrderController";
import { buildOrderRoutes } from "./presentation/http/routes/orderRoutes";

export const createOrdersModuleRouter = (): Router => {
  const orderRepository = new InMemoryOrderRepository();
  const createOrderUseCase = new CreateOrderUseCase(orderRepository);
  const createOrderController = new CreateOrderController(createOrderUseCase);

  return buildOrderRoutes(createOrderController);
};
