import { prisma } from "../../../../infrastructure/database/prismaClient";
import { Order } from "../../domain/entities/Order";
import { CreateOrderInput, IOrderRepository } from "../../domain/repositories/IOrderRepository";
import { OrderStatus } from "../../domain/rules/OrderStatus";
import { OrderStatus as PrismaOrderStatus } from "@prisma/client";

export class PrismaOrderRepository implements IOrderRepository {
  private toDomain(prismaOrder: any): Order {
    let domainStatus: OrderStatus;
    switch (prismaOrder.status) {
      case PrismaOrderStatus.PENDING_PAYMENT:
        domainStatus = OrderStatus.CREATED; // Map to base OrderStatus
        break;
      case PrismaOrderStatus.PAID:
        domainStatus = OrderStatus.CREATED;
        break;
      case PrismaOrderStatus.PREPARING:
        domainStatus = OrderStatus.PREPARING;
        break;
      case PrismaOrderStatus.READY:
        domainStatus = OrderStatus.READY;
        break;
      case PrismaOrderStatus.COMPLETED:
        domainStatus = OrderStatus.COMPLETED;
        break;
      case PrismaOrderStatus.CANCELLED:
        domainStatus = OrderStatus.CANCELLED;
        break;
      default:
        domainStatus = OrderStatus.CREATED;
    }

    return {
      id: prismaOrder.id,
      userId: prismaOrder.userId,
      vendorId: prismaOrder.vendorId,
      totalAmount: Number(prismaOrder.totalAmount.toString()),
      status: domainStatus,
      createdAt: prismaOrder.createdAt,
    };
  }

  async create(input: CreateOrderInput): Promise<Order> {
    const prismaOrder = await prisma.order.create({
      data: {
        userId: input.userId,
        vendorId: input.vendorId,
        totalAmount: input.totalAmount,
        status: PrismaOrderStatus.PENDING_PAYMENT,
      },
    });
    return this.toDomain(prismaOrder);
  }
}
