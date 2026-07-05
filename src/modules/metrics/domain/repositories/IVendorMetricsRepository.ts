import {
  VendorMetricsSummary,
  OrdersByStatus,
  SalesTimeseries,
  TopProduct,
  TopCustomer,
  RecentVendorOrder,
} from "../types/vendorMetrics.types";

export interface IVendorMetricsRepository {
  getSummary(vendorId: string, dateRange: { start: Date; end: Date }): Promise<VendorMetricsSummary>;
  
  getOrdersByStatus(vendorId: string, dateRange: { start: Date; end: Date }): Promise<OrdersByStatus[]>;
  
  getSalesTimeseries(
    vendorId: string,
    dateRange: { start: Date; end: Date },
    bucket: "hour" | "day"
  ): Promise<SalesTimeseries[]>;
  
  getTopProducts(
    vendorId: string,
    dateRange: { start: Date; end: Date },
    limit: number
  ): Promise<TopProduct[]>;
  
  getTopCustomers(
    vendorId: string,
    dateRange: { start: Date; end: Date },
    limit: number
  ): Promise<TopCustomer[]>;
  
  getRecentOrders(vendorId: string, limit: number): Promise<RecentVendorOrder[]>;
}
