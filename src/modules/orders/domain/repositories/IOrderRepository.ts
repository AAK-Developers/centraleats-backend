import { Order } from "../entities/Order";

export interface CreateOrderInput {
  userId: string;
  vendorId: string;
  totalAmount: number;
}

export interface IOrderRepository {
  create(input: CreateOrderInput): Promise<Order>;
}
