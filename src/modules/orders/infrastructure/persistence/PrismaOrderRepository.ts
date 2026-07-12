import { prisma } from "../../../../infrastructure/database/prismaClient";
import { Order } from "../../domain/entities/Order";
import { CreateOrderInput, IOrderRepository } from "../../domain/repositories/IOrderRepository";
import { OrderStatus as PrismaOrderStatus } from "@prisma/client";
import { StockError } from "../../domain/rules/StockError";
import crypto from "crypto";

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
    const MAX_RETRIES = 3;
    let retries = 0;

    while (retries < MAX_RETRIES) {
      try {
        const randomCode = Math.floor(1000 + Math.random() * 9000).toString();

        const prismaOrder = await prisma.$transaction(async (tx) => {
          // 1. Decremento atómico de stock (previene sobreventa)
          for (const item of input.items) {
            const result = await tx.product.updateMany({
              where: {
                id: item.productId,
                stock: { gte: item.quantity },
                isActive: true,
                isAvailable: true,
              },
              data: {
                stock: { decrement: item.quantity },
              },
            });

            if (result.count === 0) {
              throw new Error(`INSUFFICIENT_STOCK_${item.productId}`);
            }
          }

          // 2. Creación de orden
          return await tx.order.create({
            data: {
              userId: input.userId,
              vendorId: input.vendorId,
              totalAmount: input.totalAmount, // Centavos — computed server-side
              status: PrismaOrderStatus.PENDING_PAYMENT,
              pickupCode: randomCode,
              items: {
                create: input.items.map((item) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice, // Price snapshot at order time (centavos)
                })),
              },
            },
          });
        });

        return this.toDomain(prismaOrder);
      } catch (error: any) {
        if (error.message.startsWith("INSUFFICIENT_STOCK_")) {
          const productId = error.message.replace("INSUFFICIENT_STOCK_", "");
          throw new StockError(productId);
        }

        // P2002 es el código de Prisma para Unique Constraint Violation
        if (error.code === "P2002" && error.meta?.target?.includes("pickupCode")) {
          retries++;
          if (retries === MAX_RETRIES) {
            throw new Error("No se pudo generar un código de retiro único después de varios intentos");
          }
          continue; // Reintentar con un nuevo código
        }

        throw error;
      }
    }
    
    throw new Error("Error inesperado al crear la orden");
  }

  async findByUserId(userId: string, filters?: { status?: PrismaOrderStatus; active?: boolean }): Promise<any[]> {
    const where: any = { userId };
    
    if (filters?.status && filters?.active === true) {
      const activeStatuses: PrismaOrderStatus[] = [
        PrismaOrderStatus.PENDING_PAYMENT,
        PrismaOrderStatus.PAID,
        PrismaOrderStatus.RECEIVED,
        PrismaOrderStatus.PREPARING,
        PrismaOrderStatus.READY,
        PrismaOrderStatus.PICKED_UP
      ];
      if (activeStatuses.includes(filters.status)) {
        where.status = filters.status;
      } else {
        where.status = "NONE";
      }
    } else if (filters?.status) {
      where.status = filters.status;
    } else if (filters?.active === true) {
      where.status = {
        notIn: [PrismaOrderStatus.COMPLETED, PrismaOrderStatus.CANCELLED]
      };
    }

    const prismaOrders = await prisma.order.findMany({
      where,
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
        vendorName: order.vendor.name,
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
        vendor: {
          select: { name: true },
        },
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
        vendorName: order.vendor?.name,
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
