import { OrderStatus } from "../rules/OrderStatus";

export interface Order {
  id: string;
  userId: string;
  vendorId: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
}
