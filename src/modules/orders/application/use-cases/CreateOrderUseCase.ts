import { z } from "zod";

import { CreateOrderInput, IOrderRepository } from "../../domain/repositories/IOrderRepository";

export const createOrderSchema = z.object({
  userId: z.string().uuid(),
  vendorId: z.string().uuid(),
  totalAmount: z.number().nonnegative(),
});

export class CreateOrderUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(input: CreateOrderInput) {
    return this.orderRepository.create(input);
  }
}
