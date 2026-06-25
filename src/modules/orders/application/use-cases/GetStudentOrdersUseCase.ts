import { IOrderRepository } from "../../domain/repositories/IOrderRepository";
import { PrismaUserRepository } from "../../../users/infrastructure/persistence/PrismaUserRepository";
import { AppError } from "../../../../shared/errors/AppError";
import { OrderStatus } from "@prisma/client";

export interface GetStudentOrdersFilters {
  status?: OrderStatus;
  active?: boolean;
}

export class GetStudentOrdersUseCase {
  private readonly userRepository = new PrismaUserRepository();

  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(clerkId: string, filters?: GetStudentOrdersFilters): Promise<any[]> {
    const user = await this.userRepository.findByClerkId(clerkId);

    if (!user) {
      throw new AppError("User not found in system. Please select a role first.", 404);
    }

    if (user.role !== "STUDENT") {
      return [];
    }

    return await this.orderRepository.findByUserId(user.id, filters);
  }
}
