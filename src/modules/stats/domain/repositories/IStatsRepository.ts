export interface DashboardSummary {
    restaurants: number;
    products: number;
    completedOrders: number;
    totalRevenue: number;
    averageTicket: number;
    averageDeliveryTime: number;
}

export interface TopRestaurant {
    vendorId: string;
    vendorName: string;
    completedOrders: number;
    totalRevenue: number;
}

export interface TopProduct {
    productId: string;
    productName: string;
    imageUrl: string | null;
    vendorName: string;
    totalSold: number;
}

export interface CategoryStat {
    category: string;
    totalSold: number;
}

export interface OrdersByHour {
    hour: number;
    orders: number;
}

export interface OrdersByWeekday {
    day: string;
    orders: number;
}

export interface DeliveryRanking {
    vendorId: string;
    vendorName: string;
    averageMinutes: number;
}

export interface StatusDistribution {
    status: string;
    total: number;
}

export interface RecentOrder {
    id: string;
    vendor: string;
    total: number;
    createdAt: Date;
    status: string;
}

export interface DashboardStats {
    generatedAt: Date;

    summary: DashboardSummary;

    topRestaurants: TopRestaurant[];

    topProducts: TopProduct[];

    categories: CategoryStat[];

    ordersByHour: OrdersByHour[];

    ordersByWeekday: OrdersByWeekday[];

    deliveryRanking: DeliveryRanking[];

    statusDistribution: StatusDistribution[];

    recentOrders: RecentOrder[];
}

export interface IStatsRepository {
    getDashboardStats(): Promise<DashboardStats>;
}