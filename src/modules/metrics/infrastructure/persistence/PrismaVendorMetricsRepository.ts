import { OrderStatus } from "@prisma/client";
import { prisma } from "../../../../infrastructure/database/prismaClient";
import { IVendorMetricsRepository } from "../../domain/repositories/IVendorMetricsRepository";
import {
  VendorMetricsSummary,
  OrdersByStatus,
  SalesTimeseries,
  TopProduct,
  TopCustomer,
  RecentVendorOrder,
} from "../../domain/types/vendorMetrics.types";

export class PrismaVendorMetricsRepository implements IVendorMetricsRepository {
  async getSummary(vendorId: string, dateRange: { start: Date; end: Date }): Promise<VendorMetricsSummary> {
    const [revenueAgg, ordersCount, activeOrders] = await Promise.all([
      prisma.order.aggregate({
        where: {
          vendorId,
          status: OrderStatus.COMPLETED,
          createdAt: { gte: dateRange.start, lte: dateRange.end },
        },
        _sum: { totalAmount: true },
        _avg: { totalAmount: true },
      }),
      prisma.order.count({
        where: {
          vendorId,
          status: OrderStatus.COMPLETED,
          createdAt: { gte: dateRange.start, lte: dateRange.end },
        },
      }),
      prisma.order.count({
        where: {
          vendorId,
          status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
        },
      }),
    ]);

    return {
      totalRevenue: revenueAgg._sum.totalAmount || 0,
      totalOrders: ordersCount,
      averageTicket: Math.round(revenueAgg._avg.totalAmount || 0),
      activeOrders,
    };
  }

  async getOrdersByStatus(
    vendorId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<OrdersByStatus[]> {
    const result = await prisma.order.groupBy({
      by: ["status"],
      where: {
        vendorId,
        createdAt: { gte: dateRange.start, lte: dateRange.end },
      },
      _count: { _all: true },
    });

    return result.map((item) => ({
      status: item.status,
      count: item._count._all,
    }));
  }

  async getSalesTimeseries(
    vendorId: string,
    dateRange: { start: Date; end: Date },
    bucket: "hour" | "day"
  ): Promise<SalesTimeseries[]> {
    const orders = await prisma.order.findMany({
      where: {
        vendorId,
        status: OrderStatus.COMPLETED,
        createdAt: { gte: dateRange.start, lte: dateRange.end },
      },
      select: { createdAt: true, totalAmount: true },
    });

    const bucketMap = new Map<string, { revenue: number; orders: number }>();

    for (const order of orders) {
      // Adjust to Ecuador timezone (UTC-5)
      const ecuadorDate = new Date(order.createdAt.getTime() - 5 * 60 * 60 * 1000);
      let bucketKey = "";

      if (bucket === "hour") {
        const hour = ecuadorDate.getUTCHours().toString().padStart(2, "0");
        bucketKey = `${hour}:00`;
      } else {
        const year = ecuadorDate.getUTCFullYear();
        const month = (ecuadorDate.getUTCMonth() + 1).toString().padStart(2, "0");
        const day = ecuadorDate.getUTCDate().toString().padStart(2, "0");
        bucketKey = `${year}-${month}-${day}`;
      }

      const current = bucketMap.get(bucketKey) || { revenue: 0, orders: 0 };
      current.revenue += order.totalAmount;
      current.orders += 1;
      bucketMap.set(bucketKey, current);
    }

    const timeseries: SalesTimeseries[] = [];
    for (const [key, value] of bucketMap.entries()) {
      timeseries.push({ bucket: key, revenue: value.revenue, orders: value.orders });
    }

    return timeseries.sort((a, b) => a.bucket.localeCompare(b.bucket));
  }

  async getTopProducts(
    vendorId: string,
    dateRange: { start: Date; end: Date },
    limit: number
  ): Promise<TopProduct[]> {
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          vendorId,
          status: OrderStatus.COMPLETED,
          createdAt: { gte: dateRange.start, lte: dateRange.end },
        },
      },
      include: { product: true },
    });

    const productMap = new Map<string, TopProduct>();

    for (const item of orderItems) {
      const key = item.productId;
      if (!productMap.has(key)) {
        productMap.set(key, {
          productId: key,
          productName: item.product.name,
          imageUrl: item.product.imageUrl,
          totalSold: 0,
          totalRevenue: 0,
        });
      }

      const current = productMap.get(key)!;
      current.totalSold += item.quantity;
      current.totalRevenue += item.quantity * item.unitPrice;
    }

    return Array.from(productMap.values())
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit);
  }

  async getTopCustomers(
    vendorId: string,
    dateRange: { start: Date; end: Date },
    limit: number
  ): Promise<TopCustomer[]> {
    const orders = await prisma.order.findMany({
      where: {
        vendorId,
        status: OrderStatus.COMPLETED,
        createdAt: { gte: dateRange.start, lte: dateRange.end },
      },
      include: { user: { select: { fullName: true } } },
    });

    const customerMap = new Map<string, TopCustomer>();

    for (const order of orders) {
      const key = order.userId;
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          userId: key,
          fullName: order.user?.fullName || "Unknown",
          totalOrders: 0,
          totalSpent: 0,
        });
      }

      const current = customerMap.get(key)!;
      current.totalOrders += 1;
      current.totalSpent += order.totalAmount;
    }

    return Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  }

  async getRecentOrders(vendorId: string, limit: number): Promise<RecentVendorOrder[]> {
    const orders = await prisma.order.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        items: {
          include: { product: { select: { name: true } } },
        },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      pickupCode: order.pickupCode,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        productName: item.product.name,
        quantity: item.quantity,
      })),
    }));
  }
}
