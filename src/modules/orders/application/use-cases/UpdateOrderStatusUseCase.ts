import { OrderStatus } from "@prisma/client";
import { IOrderRepository } from "../../domain/repositories/IOrderRepository";
import { PrismaUserRepository } from "../../../users/infrastructure/persistence/PrismaUserRepository";
import { PrismaVendorRepository } from "../../../vendors/infrastructure/persistence/PrismaVendorRepository";
import { AppError } from "../../../../shared/errors/AppError";

export class UpdateOrderStatusUseCase {
  private readonly userRepository = new PrismaUserRepository();
  private readonly vendorRepository = new PrismaVendorRepository();

  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(orderId: string, targetStatus: OrderStatus, actorClerkId: string) {
    const user = await this.userRepository.findByClerkId(actorClerkId);
    if (!user) {
      throw new AppError("Actor user not found", 404);
    }

    if (!user.isActive) {
      throw new AppError("Actor account is deactivated", 403);
    }

    if (user.role === "PENDING") {
      throw new AppError("Actor role is pending onboarding", 403);
    }

    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // 1. Role and Ownership Validations (State Machine Actor Restrictions)
    if (user.role === "ADMIN") {
      // ADMIN is allowed to do any transitions
    } else if (targetStatus === OrderStatus.PAID) {
      // PENDING_PAYMENT -> PAID: STUDENT who placed the order
      if (user.role !== "STUDENT" || order.userId !== user.id) {
        throw new AppError("Forbidden: Only the student who placed the order can confirm payment", 403);
      }
    } else if (targetStatus === OrderStatus.CANCELLED) {
      // * -> CANCELLED: VENDOR who owns the restaurant, or ADMIN
      if (user.role !== "VENDOR") {
        throw new AppError("Forbidden: Only the restaurant owner or an admin can cancel this order", 403);
      }
      const vendor = await this.vendorRepository.findByOwnerId(user.id);
      if (!vendor || vendor.id !== order.vendorId) {
        throw new AppError("Forbidden: Only the restaurant owner can cancel this order", 403);
      }
    } else {
      // PAID -> RECEIVED -> PREPARING -> READY -> PICKED_UP -> COMPLETED
      // Must be the VENDOR who owns the restaurant
      if (user.role !== "VENDOR") {
        throw new AppError("Forbidden: Only the restaurant owner can update this order status", 403);
      }
      const vendor = await this.vendorRepository.findByOwnerId(user.id);
      if (!vendor || vendor.id !== order.vendorId) {
        throw new AppError("Forbidden: You do not own the restaurant for this order", 403);
      }
    }

    // 2. Use the Order domain model to validate and apply the state transition
    order.transitionTo(targetStatus);

    // 3. Persist the updated status
    return this.orderRepository.updateStatus(orderId, order.status);
  }
}
