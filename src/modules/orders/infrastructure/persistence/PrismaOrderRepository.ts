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

  async findByUserId(userId: string): Promise<any[]> {
    const prismaOrders = await prisma.order.findMany({
      where: { userId },
      include: {
        vendor: {
          select: {
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return prismaOrders.map(order => {
      // Map database order status to Domain OrderStatus using toDomain logic
      const domainOrder = this.toDomain(order);
      return {
        ...domainOrder,
        vendor: order.vendor,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice.toString()),
          productName: item.product.name,
        })),
      };
    });
  }
}
