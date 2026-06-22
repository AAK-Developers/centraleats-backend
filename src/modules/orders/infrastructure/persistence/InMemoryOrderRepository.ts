import { randomUUID } from "node:crypto";

import { Order } from "../../domain/entities/Order";
import { CreateOrderInput, IOrderRepository } from "../../domain/repositories/IOrderRepository";
import { OrderStatus } from "../../domain/rules/OrderStatus";

export class InMemoryOrderRepository implements IOrderRepository {
  private readonly orders: Order[] = [];

  async create(input: CreateOrderInput): Promise<Order> {
    const order: Order = {
      id: randomUUID(),
      userId: input.userId,
      vendorId: input.vendorId,
      totalAmount: input.totalAmount,
      status: OrderStatus.CREATED,
      createdAt: new Date(),
    };

    this.orders.push(order);

    return order;
  }

  async findByUserId(userId: string): Promise<any[]> {
    return this.orders
      .filter((order) => order.userId === userId)
      .map((order) => ({
        ...order,
        vendor: { name: "Mock Vendor" },
        items: [],
      }));
  }
}
