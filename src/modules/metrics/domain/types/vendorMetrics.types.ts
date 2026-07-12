export interface VendorMetricsSummary {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  activeOrders: number;
}

export interface OrdersByStatus {
  status: string;
  count: number;
}

export interface SalesTimeseries {
  bucket: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  imageUrl: string | null;
  totalSold: number;
  totalRevenue: number;
}

export interface TopCustomer {
  userId: string;
  fullName: string;
  totalOrders: number;
  totalSpent: number;
}

export interface RecentVendorOrder {
  id: string;
  status: string;
  totalAmount: number;
  pickupCode: string | null;
  createdAt: Date;
  items: { productName: string; quantity: number }[];
}
