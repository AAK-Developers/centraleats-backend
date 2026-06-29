import { IOrderRepository } from "../../domain/repositories/IOrderRepository";

export class GetVendorOrdersUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(vendorId: string): Promise<any[]> {
    return this.orderRepository.findByVendorId(vendorId);
  }
}
