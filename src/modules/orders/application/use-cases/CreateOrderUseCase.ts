import { CreateOrderInput, IOrderRepository } from "../../domain/repositories/IOrderRepository";
import { IProductRepository } from "../../../catalog/domain/repositories/IProductRepository";
import { PrismaUserRepository } from "../../../users/infrastructure/persistence/PrismaUserRepository";
import { StockError } from "../../domain/rules/StockError";
import { AppError } from "../../../../shared/errors/AppError";

/**
 * DTO for CreateOrderUseCase.
 * 
 * SECURITY: userId and totalAmount are intentionally ABSENT from this DTO.
 * - userId: resolved from the Clerk JWT token (server-side) to prevent BOLA.
 * - totalAmount: computed server-side from product.price.value to prevent price tampering.
 */
export interface CreateOrderDTO {
  clerkId: string;             // Resolved from JWT — never from client body
  vendorId: string;
  notes?: string;
  items: { productId: string; quantity: number }[];
}

export class CreateOrderUseCase {
  private readonly userRepository = new PrismaUserRepository();

  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(dto: CreateOrderDTO) {
    // Step 1: Resolve the authenticated user from the Clerk token
    const user = await this.userRepository.findByClerkId(dto.clerkId);
    if (!user) {
      throw new AppError("User not found. Please complete onboarding first.", 404);
    }

    // Step 2: Validate products, check stock, and build items with server-side pricing
    const itemsWithPrice = [];
    let totalAmount = 0;

    for (const item of dto.items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product || !product.isActive) {
        throw new AppError(`Product ${item.productId} not found or inactive`, 404);
      }
      if (product.stock < item.quantity) {
        throw new StockError(item.productId);
      }

      const unitPrice = product.price.value; // Centavos (server-side, not client-provided)
      itemsWithPrice.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
      });

      totalAmount += unitPrice * item.quantity; // Server-computed total
    }

    // Step 3: Persist the order with server-resolved userId and computed totalAmount
    const createInput: CreateOrderInput = {
      userId: user.id,          // Resolved from JWT
      vendorId: dto.vendorId,
      totalAmount,              // Computed server-side (centavos)
      items: itemsWithPrice,
    };

    return this.orderRepository.create(createInput);
  }
}
