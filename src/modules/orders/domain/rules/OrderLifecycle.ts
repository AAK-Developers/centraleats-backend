import { OrderStatus } from "./OrderStatus";

export class InvalidStatusTransitionError extends Error {
  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Cannot transition order status from ${from} to ${to}`);
    this.name = "InvalidStatusTransitionError";
  }
}

const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.CREATED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

export class OrderLifecycle {
  static canTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    return validTransitions[currentStatus].includes(newStatus);
  }

  static transition(currentStatus: OrderStatus, newStatus: OrderStatus): OrderStatus {
    if (!this.canTransition(currentStatus, newStatus)) {
      throw new InvalidStatusTransitionError(currentStatus, newStatus);
    }
    return newStatus;
  }
}
