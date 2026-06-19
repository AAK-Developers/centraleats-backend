import { OrderStatus } from "../../../src/modules/orders/domain/rules/OrderStatus";
import { OrderLifecycle, InvalidStatusTransitionError } from "../../../src/modules/orders/domain/rules/OrderLifecycle";

describe("OrderLifecycle Domain Rules", () => {
  it("should allow transition from CREATED to PREPARING", () => {
    const nextStatus = OrderLifecycle.transition(OrderStatus.CREATED, OrderStatus.PREPARING);
    expect(nextStatus).toBe(OrderStatus.PREPARING);
  });

  it("should allow transition from PREPARING to READY", () => {
    const nextStatus = OrderLifecycle.transition(OrderStatus.PREPARING, OrderStatus.READY);
    expect(nextStatus).toBe(OrderStatus.READY);
  });

  it("should prevent transitioning from COMPLETED to CANCELLED", () => {
    expect(() => {
      OrderLifecycle.transition(OrderStatus.COMPLETED, OrderStatus.CANCELLED);
    }).toThrow(InvalidStatusTransitionError);
  });

  it("should prevent transitioning backwards from READY to PREPARING", () => {
    expect(() => {
      OrderLifecycle.transition(OrderStatus.READY, OrderStatus.PREPARING);
    }).toThrow(InvalidStatusTransitionError);
  });
});
