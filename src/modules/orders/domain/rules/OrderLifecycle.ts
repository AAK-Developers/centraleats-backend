import { OrderStatus } from "@prisma/client";

/**
 * Order Lifecycle State Machine — Lenguaje Ubicuo v4.0 (Doc. 08.x)
 * 
 * 1. PENDING_PAYMENT  - Orden creada, esperando pago
 * 2. PAID             - Pago confirmado
 * 3. RECEIVED         - Vendor recibió la notificación
 * 4. PREPARING        - Vendor está preparando
 * 5. READY            - Lista para recoger
 * 6. PICKED_UP        - Cliente recogió la orden
 * 7. COMPLETED        - Ciclo finalizado exitosamente
 * x. CANCELLED        - Excepción: cancelada
 */
export const OrderLifecycle: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: [OrderStatus.PAID, OrderStatus.RECEIVED, OrderStatus.CANCELLED],
  PAID: [OrderStatus.RECEIVED, OrderStatus.CANCELLED],
  RECEIVED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.READY, OrderStatus.CANCELLED],
  READY: [OrderStatus.PICKED_UP], // Ya no se puede cancelar si está lista
  PICKED_UP: [OrderStatus.COMPLETED],
  COMPLETED: [], // Estado final
  CANCELLED: [], // Estado final
};

export function canTransitionTo(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
  if (currentStatus === targetStatus) return false;
  return OrderLifecycle[currentStatus].includes(targetStatus);
}
