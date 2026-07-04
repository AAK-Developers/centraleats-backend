import { IVendorMetricsRepository } from "../../domain/repositories/IVendorMetricsRepository";
import { OrdersByStatus } from "../../domain/types/vendorMetrics.types";
import { parseDateRange } from "../utils/dateParser";

export class GetVendorOrdersByStatusUseCase {
  constructor(private readonly metricsRepository: IVendorMetricsRepository) {}

  async execute(vendorId: string, range: string): Promise<OrdersByStatus[]> {
    const dateRange = parseDateRange(range || "today");
    return this.metricsRepository.getOrdersByStatus(vendorId, dateRange);
  }
}
