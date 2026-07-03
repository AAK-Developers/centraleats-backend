import { OrderStatus } from "@prisma/client";
import { prisma } from "../../../../infrastructure/database/prismaClient";

import {
    DashboardStats,
    CategoryStat,
    DeliveryRanking,
    IStatsRepository,
    OrdersByHour,
    RecentOrder,
    StatusDistribution,
    TopProduct,
    TopRestaurant,
} from "../../domain/repositories/IStatsRepository";

export class PrismaStatsRepository implements IStatsRepository {

    async getDashboardStats(): Promise<DashboardStats> {

        // ============================
        // SUMMARY
        // ============================

        const [
            restaurants,
            products,
            completedOrders,
            revenue,
            completed,
            recentOrdersDB,
            statusDistributionDB,
            vendors,
            orderItems,
            completedOrdersData,
        ] = await Promise.all([

            prisma.vendor.count({
                where: {
                    isActive: true,
                },
            }),

            prisma.product.count({
                where: {
                    isActive: true,
                },
            }),

            prisma.order.count({
                where: {
                    status: OrderStatus.COMPLETED,
                },
            }),

            prisma.order.aggregate({
                where: {
                    status: OrderStatus.COMPLETED,
                },
                _sum: {
                    totalAmount: true,
                },
                _avg: {
                    totalAmount: true,
                },
            }),

            prisma.order.findMany({
                where: {
                    status: OrderStatus.COMPLETED,
                },
                select: {
                    createdAt: true,
                    updatedAt: true,
                },
            }),

            prisma.order.findMany({
                where: {
                    status: OrderStatus.COMPLETED,
                },
                take: 10,
                orderBy: {
                    createdAt: "desc",
                },
                include: {
                    vendor: {
                        select: {
                            name: true,
                        },
                    },
                },
            }),

            prisma.order.groupBy({
                by: ["status"],
                _count: true,
            }),

            prisma.vendor.findMany({
                select: {
                    id: true,
                    name: true,
                    orders: {
                        where: {
                            status: OrderStatus.COMPLETED,
                        },
                        select: {
                            totalAmount: true,
                            createdAt: true,
                            updatedAt: true,
                        },
                    },
                },
            }),

            prisma.orderItem.findMany({
                where: {
                    order: {
                        status: OrderStatus.COMPLETED,
                    },
                },
                include: {
                    product: {
                        include: {
                            vendor: true,
                            category: true,
                        },
                    },
                },
            }),

            prisma.order.findMany({
                where: {
                    status: OrderStatus.COMPLETED,
                },
                include: {
                    vendor: true,
                },
            }),

        ]);

        // ============================
        // DELIVERY TIME
        // ============================

        let averageDeliveryTime = 0;

        if (completed.length > 0) {

            const totalMinutes = completed.reduce((acc, order) => {

                const minutes =
                    (order.updatedAt.getTime() - order.createdAt.getTime()) / 60000;

                return acc + minutes;

            }, 0);

            averageDeliveryTime = Math.round(totalMinutes / completed.length);

        }

        // ============================
        // TOP RESTAURANTS
        // ============================

        const topRestaurants: TopRestaurant[] = vendors
            .map((vendor) => {

                const totalRevenue = vendor.orders.reduce(
                    (sum, order) => sum + order.totalAmount,
                    0
                );

                return {
                    vendorId: vendor.id,
                    vendorName: vendor.name,
                    completedOrders: vendor.orders.length,
                    totalRevenue,
                };

            })
            .sort((a, b) => b.completedOrders - a.completedOrders)
            .slice(0, 10);

        // ============================
        // TOP PRODUCTS
        // ============================

        const productsMap = new Map<string, TopProduct>();

        orderItems.forEach((item) => {

            const key = item.productId;

            if (!productsMap.has(key)) {

                productsMap.set(key, {
                    productId: key,
                    productName: item.product.name,
                    imageUrl: item.product.imageUrl,
                    vendorName: item.product.vendor.name,
                    totalSold: 0,
                });

            }

            productsMap.get(key)!.totalSold += item.quantity;

        });

        const topProducts = Array.from(productsMap.values())
            .sort((a, b) => b.totalSold - a.totalSold)
            .slice(0, 10);

        // ============================
        // CATEGORIES
        // ============================

        const categoryMap = new Map<string, number>();

        orderItems.forEach((item) => {

            const category = item.product.category.name;

            categoryMap.set(
                category,
                (categoryMap.get(category) || 0) + item.quantity
            );

        });

        const categories: CategoryStat[] = Array.from(categoryMap.entries())
            .map(([category, totalSold]) => ({
                category,
                totalSold,
            }))
            .sort((a, b) => b.totalSold - a.totalSold);

        // ============================
        // ORDERS BY HOUR
        // ============================

        const hourMap = new Map<number, number>();

        completedOrdersData.forEach((order) => {

            const hour = order.createdAt.getHours();

            hourMap.set(hour, (hourMap.get(hour) || 0) + 1);

        });

        const ordersByHour: OrdersByHour[] = [];

        for (let hour = 0; hour < 24; hour++) {

            ordersByHour.push({
                hour,
                orders: hourMap.get(hour) || 0,
            });

        }

        // ============================
        // DELIVERY RANKING
        // ============================

        const deliveryRanking: DeliveryRanking[] = vendors
            .map((vendor) => {

                if (vendor.orders.length === 0) {

                    return {
                        vendorId: vendor.id,
                        vendorName: vendor.name,
                        averageMinutes: 0,
                    };

                }

                const totalMinutes = vendor.orders.reduce((sum, order) => {

                    return (
                        sum +
                        (order.updatedAt.getTime() - order.createdAt.getTime()) / 60000
                    );

                }, 0);

                return {

                    vendorId: vendor.id,

                    vendorName: vendor.name,

                    averageMinutes: Math.round(
                        totalMinutes / vendor.orders.length
                    ),

                };

            })
            .sort((a, b) => a.averageMinutes - b.averageMinutes);

        // ============================
        // STATUS DISTRIBUTION
        // ============================

        const statusDistribution: StatusDistribution[] =
            statusDistributionDB.map((item) => ({
                status: item.status,
                total: item._count,
            }));

        // ============================
        // RECENT ORDERS
        // ============================

        const recentOrders: RecentOrder[] = recentOrdersDB.map((order) => ({
            id: order.id,
            vendor: order.vendor.name,
            total: order.totalAmount,
            createdAt: order.createdAt,
            status: order.status,
        }));

        // ============================
        // RETURN
        // ============================

        return {

            generatedAt: new Date(),

            summary: {

                restaurants,

                products,

                completedOrders,

                totalRevenue: revenue._sum.totalAmount ?? 0,

                averageTicket: Math.round(
                    revenue._avg.totalAmount ?? 0
                ),

                averageDeliveryTime,

            },

            topRestaurants,

            topProducts,

            categories,

            ordersByHour,

            ordersByWeekday: [],

            deliveryRanking,

            statusDistribution,

            recentOrders,

        };

    }

}