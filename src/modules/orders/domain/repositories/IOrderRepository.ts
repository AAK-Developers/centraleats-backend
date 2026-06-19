import { Order } from "../entities/Order";

export interface CreateOrderInput {
  userId: string;
  vendorId: string;
  totalAmount: number;
  items: { productId: string; quantity: number }[];
}

export interface IOrderRepository {
  create(input: CreateOrderInput): Promise<Order>;
  findByUserId(userId: string): Promise<any[]>;
}
