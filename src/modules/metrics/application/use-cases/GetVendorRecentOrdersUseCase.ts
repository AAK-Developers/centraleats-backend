import { IVendorMetricsRepository } from "../../domain/repositories/IVendorMetricsRepository";
import { RecentVendorOrder } from "../../domain/types/vendorMetrics.types";

export class GetVendorRecentOrdersUseCase {
  constructor(private readonly metricsRepository: IVendorMetricsRepository) {}

  async execute(vendorId: string, limit: number = 10): Promise<RecentVendorOrder[]> {
    return this.metricsRepository.getRecentOrders(vendorId, limit);
  }
}
