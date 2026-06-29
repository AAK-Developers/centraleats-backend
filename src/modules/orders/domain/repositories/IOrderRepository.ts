import { OrderStatus } from "@prisma/client";
import { Order } from "../entities/Order";

export interface CreateOrderInput {
  userId: string;
  vendorId: string;
  totalAmount: number;
  items: { productId: string; quantity: number; unitPrice: number }[];
}

export interface IOrderRepository {
  create(input: CreateOrderInput): Promise<Order>;
  findByUserId(userId: string, filters?: { status?: OrderStatus; active?: boolean }): Promise<any[]>;
  findByVendorId(vendorId: string): Promise<any[]>;
  findById(id: string): Promise<Order | null>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
}
