import { IVendorMetricsRepository } from "../../domain/repositories/IVendorMetricsRepository";
import { SalesTimeseries } from "../../domain/types/vendorMetrics.types";
import { parseDateRange } from "../utils/dateParser";

export class GetVendorSalesTimeseriesUseCase {
  constructor(private readonly metricsRepository: IVendorMetricsRepository) {}

  async execute(vendorId: string, range: string, bucket: "hour" | "day"): Promise<SalesTimeseries[]> {
    const dateRange = parseDateRange(range || "today");
    const validBucket = bucket === "day" ? "day" : "hour";
    return this.metricsRepository.getSalesTimeseries(vendorId, dateRange, validBucket);
  }
}
