import { IVendorMetricsRepository } from "../../domain/repositories/IVendorMetricsRepository";
import { VendorMetricsSummary } from "../../domain/types/vendorMetrics.types";
import { parseDateRange } from "../utils/dateParser";

export class GetVendorMetricsSummaryUseCase {
  constructor(private readonly metricsRepository: IVendorMetricsRepository) {}

  async execute(vendorId: string, range: string): Promise<VendorMetricsSummary> {
    const dateRange = parseDateRange(range || "today");
    return this.metricsRepository.getSummary(vendorId, dateRange);
  }
}
