import { prisma } from "../../../../infrastructure/database/prismaClient";
import { Order } from "../../domain/entities/Order";
import { CreateOrderInput, IOrderRepository } from "../../domain/repositories/IOrderRepository";
import { OrderStatus as PrismaOrderStatus } from "@prisma/client";

export class PrismaOrderRepository implements IOrderRepository {
  private toDomain(prismaOrder: any): Order {
    return Order.reconstitute(
      prismaOrder.id,
      prismaOrder.userId,
      prismaOrder.vendorId,
      prismaOrder.totalAmount, // Already Int
      prismaOrder.status,
      prismaOrder.pickupCode,
      prismaOrder.notes,
      prismaOrder.createdAt,
      prismaOrder.updatedAt || prismaOrder.createdAt
    );
  }

  async create(input: CreateOrderInput): Promise<Order> {
    const prismaOrder = await prisma.order.create({
      data: {
        userId: input.userId,
        vendorId: input.vendorId,
        totalAmount: input.totalAmount, // Centavos
        status: PrismaOrderStatus.PENDING_PAYMENT,
        items: {
          create: input.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice, // Centavos historicos
          })),
        },
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
      const domainOrder = this.toDomain(order);
      const primitiveOrder = domainOrder.toPrimitives();
      
      return {
        ...primitiveOrder,
        vendor: order.vendor,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice, // Int centavos
          productName: item.product.name,
        })),
      };
    });
  }
}
