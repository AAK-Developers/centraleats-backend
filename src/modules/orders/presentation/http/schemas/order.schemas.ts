import { z } from "zod";

/**
 * Zod schema for creating an Order.
 * 
 * SECURITY NOTES:
 * - userId is intentionally ABSENT — resolved from the Clerk JWT token server-side.
 * - totalAmount is intentionally ABSENT — computed server-side from product prices (BOLA prevention).
 * - The client only sends which products and quantities they want.
 */
export const createOrderSchema = z.object({
  vendorId: z.string().uuid("vendorId debe ser un UUID válido"),
  notes: z.string().max(300).optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid("productId debe ser un UUID válido"),
      quantity: z.number().int("La cantidad debe ser un entero").positive("La cantidad debe ser mayor a cero"),
    })
  ).min(1, "La orden debe tener al menos un producto"),
});
