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
      prismaOrder.totalAmount,  // Already Int (centavos)
      prismaOrder.status,
      prismaOrder.pickupCode ?? null,
      prismaOrder.notes ?? null,
      prismaOrder.createdAt,
      prismaOrder.updatedAt
    );
  }

  async create(input: CreateOrderInput): Promise<Order> {
    const prismaOrder = await prisma.order.create({
      data: {
        userId: input.userId,
        vendorId: input.vendorId,
        totalAmount: input.totalAmount,          // Centavos — computed server-side
        status: PrismaOrderStatus.PENDING_PAYMENT,
        items: {
          create: input.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,           // Price snapshot at order time (centavos)
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
          select: { name: true },
        },
        items: {
          include: {
            product: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return prismaOrders.map(order => {
      const domainOrder = this.toDomain(order);
      const primitives = domainOrder.toPrimitives();

      return {
        ...primitives,
        vendor: order.vendor,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,             // Int centavos (historical price)
          productName: item.product.name,
        })),
      };
    });
  }

  async findByVendorId(vendorId: string): Promise<any[]> {
    const prismaOrders = await prisma.order.findMany({
      where: { vendorId },
      include: {
        user: {
          select: { fullName: true, email: true },
        },
        items: {
          include: {
            product: {
              select: { name: true, imageUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return prismaOrders.map(order => {
      const domainOrder = this.toDomain(order);
      const primitives = domainOrder.toPrimitives();

      return {
        ...primitives,
        user: order.user,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          productName: item.product.name,
          productImageUrl: item.product.imageUrl,
        })),
      };
    });
  }

  async findById(id: string): Promise<Order | null> {
    const prismaOrder = await prisma.order.findUnique({
      where: { id },
    });
    return prismaOrder ? this.toDomain(prismaOrder) : null;
  }

  async updateStatus(id: string, status: PrismaOrderStatus): Promise<Order> {
    const prismaOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });
    return this.toDomain(prismaOrder);
  }
}
