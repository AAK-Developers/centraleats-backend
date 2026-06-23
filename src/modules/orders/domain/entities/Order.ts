import { OrderStatus } from "@prisma/client";
import { AppError } from "../../../../shared/errors/AppError";
import { Money } from "../../../../shared/domain/value-objects/Money";
import { canTransitionTo } from "../rules/OrderLifecycle";

interface CreateOrderProps {
  id: string;
  userId: string;
  vendorId: string;
  totalAmountCents: number;
  pickupCode?: string | null;
  notes?: string | null;
}

export class Order {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly vendorId: string,
    public readonly totalAmount: Money,
    public status: OrderStatus,
    public readonly pickupCode: string | null,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Crea una nueva orden validando invariantes iniciales.
   * La orden siempre nace en estado PENDING_PAYMENT.
   */
  public static create(props: CreateOrderProps): Order {
    const totalAmount = Money.fromCents(props.totalAmountCents);
    if (totalAmount.value <= 0) {
      throw new AppError("Order total amount must be greater than zero", 400);
    }

    return new Order(
      props.id,
      props.userId,
      props.vendorId,
      totalAmount,
      OrderStatus.PENDING_PAYMENT,
      props.pickupCode || null,
      props.notes || null,
      new Date(),
      new Date()
    );
  }

  /**
   * Reconstituye una orden desde la base de datos.
   */
  public static reconstitute(
    id: string,
    userId: string,
    vendorId: string,
    totalAmountCents: number,
    status: OrderStatus,
    pickupCode: string | null,
    notes: string | null,
    createdAt: Date,
    updatedAt: Date
  ): Order {
    return new Order(
      id,
      userId,
      vendorId,
      Money.fromCents(totalAmountCents),
      status,
      pickupCode,
      notes,
      createdAt,
      updatedAt
    );
  }

  /**
   * Encapsula la lógica de transición de estado (State Machine).
   * Valida si el movimiento es legal según el OrderLifecycle.
   */
  public transitionTo(newStatus: OrderStatus): void {
    if (!canTransitionTo(this.status, newStatus)) {
      throw new AppError(`Cannot transition order from ${this.status} to ${newStatus}`, 409);
    }
    this.status = newStatus;
  }

  /**
   * Extrae los primitivos para la persistencia.
   */
  public toPrimitives() {
    return {
      id: this.id,
      userId: this.userId,
      vendorId: this.vendorId,
      totalAmount: this.totalAmount.value,
      status: this.status,
      pickupCode: this.pickupCode,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
