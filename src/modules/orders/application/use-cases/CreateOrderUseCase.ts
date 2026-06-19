import { z } from "zod";
import { CreateOrderInput, IOrderRepository } from "../../domain/repositories/IOrderRepository";
import { IProductRepository } from "../../../catalog/domain/repositories/IProductRepository";
import { StockError } from "../../domain/rules/StockError";

export const createOrderSchema = z.object({
  userId: z.string().uuid(),
  vendorId: z.string().uuid(),
  totalAmount: z.number().nonnegative(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive()
  })).min(1)
});

export class CreateOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(input: CreateOrderInput) {
    for (const item of input.items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product || !product.isActive) {
        throw new Error(`Product ${item.productId} not found or inactive`);
      }
      if (product.stock < item.quantity) {
        throw new StockError(item.productId);
      }
    }
    return this.orderRepository.create(input);
  }
}
