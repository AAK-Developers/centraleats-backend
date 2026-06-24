import { z } from "zod";

export const createProductSchema = z.object({
  // vendorId NO está aquí — se resuelve del token en el servidor
  categoryId:  z.string().uuid("categoryId debe ser un UUID válido"),
  name:        z.string().min(2, "Nombre del producto requerido"),
  description: z.string().max(500).optional(),

  // z.preprocess maneja el string "350" de FormData → number 350
  price: z.preprocess(
    (val) => { const n = Number(val); return isNaN(n) ? val : n; },
    z.number()
      .int("El precio debe ser un entero en centavos (ej: 350 para $3.50)")
      .positive("El precio debe ser mayor a cero")
  ),

  // OBLIGATORIO — sin optional(). Si el frontend no lo envía, 400 Bad Request.
  stock: z.preprocess(
    (val) => {
      if (val === "" || val === undefined || val === null)
        throw new Error("El campo 'stock' es obligatorio para el control de inventario.");
      return Number(val);
    },
    z.number()
      .int("El stock debe ser un número entero")
      .nonnegative("El stock no puede ser negativo")
  ),
});
