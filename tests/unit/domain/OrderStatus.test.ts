import { OrderStatus } from "@prisma/client";
import { canTransitionTo } from "../../../src/modules/orders/domain/rules/OrderLifecycle";

describe("OrderLifecycle Domain Rules", () => {
  it("should allow transition from PENDING_PAYMENT to PAID", () => {
    const isAllowed = canTransitionTo(OrderStatus.PENDING_PAYMENT, OrderStatus.PAID);
    expect(isAllowed).toBe(true);
  });

  it("should allow transition from PREPARING to READY", () => {
    const isAllowed = canTransitionTo(OrderStatus.PREPARING, OrderStatus.READY);
    expect(isAllowed).toBe(true);
  });

  it("should prevent transitioning from COMPLETED to CANCELLED", () => {
    const isAllowed = canTransitionTo(OrderStatus.COMPLETED, OrderStatus.CANCELLED);
    expect(isAllowed).toBe(false);
  });

  it("should prevent transitioning backwards from READY to PREPARING", () => {
    const isAllowed = canTransitionTo(OrderStatus.READY, OrderStatus.PREPARING);
    expect(isAllowed).toBe(false);
  });
});
