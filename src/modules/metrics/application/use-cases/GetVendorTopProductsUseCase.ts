import { IVendorMetricsRepository } from "../../domain/repositories/IVendorMetricsRepository";
import { TopProduct } from "../../domain/types/vendorMetrics.types";
import { parseDateRange } from "../utils/dateParser";

export class GetVendorTopProductsUseCase {
  constructor(private readonly metricsRepository: IVendorMetricsRepository) {}

  async execute(vendorId: string, range: string, limit: number = 10): Promise<TopProduct[]> {
    const dateRange = parseDateRange(range || "7d");
    return this.metricsRepository.getTopProducts(vendorId, dateRange, limit);
  }
}
