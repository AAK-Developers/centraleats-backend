import { IVendorMetricsRepository } from "../../domain/repositories/IVendorMetricsRepository";
import { TopCustomer } from "../../domain/types/vendorMetrics.types";
import { parseDateRange } from "../utils/dateParser";

export class GetVendorTopCustomersUseCase {
  constructor(private readonly metricsRepository: IVendorMetricsRepository) {}

  async execute(vendorId: string, range: string, limit: number = 10): Promise<TopCustomer[]> {
    const dateRange = parseDateRange(range || "30d");
    return this.metricsRepository.getTopCustomers(vendorId, dateRange, limit);
  }
}
