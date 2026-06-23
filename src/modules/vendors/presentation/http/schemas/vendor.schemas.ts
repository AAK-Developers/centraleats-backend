import { z } from "zod";

export const registerVendorSchema = z.object({
  name:        z.string().min(3, "Nombre del local requerido (mín. 3 caracteres)"),
  description: z.string().max(500).optional(),
  location:    z.string().min(5, "Ubicación requerida dentro del campus UCE"),
  phone:       z.string().regex(/^0[9|2]\d{8}$/, "Teléfono ecuatoriano inválido (ej: 0999123456)"),
  openingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato HH:mm requerido"),
  closingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato HH:mm requerido"),
});
