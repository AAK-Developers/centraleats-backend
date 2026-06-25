import { OrderStatus } from "@prisma/client";
import { IOrderRepository } from "../../domain/repositories/IOrderRepository";
import { AppError } from "../../../../shared/errors/AppError";

export class UpdateOrderStatusUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(orderId: string, targetStatus: OrderStatus) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Use the Order domain model to validate and apply the state transition
    order.transitionTo(targetStatus);

    // Persist the updated status
    return this.orderRepository.updateStatus(orderId, order.status);
  }
}
