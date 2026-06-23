/// Vendor entity — Lenguaje Ubicuo v4.0 (Doc. 08.x APPROVED)
/// Campos de perfil obligatorios alineados con schema.prisma v3.0
export class Vendor {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly location: string,       // Obligatorio: ubicación en campus UCE
    public readonly phone: string,          // Obligatorio: contacto del local
    public readonly logoUrl: string | null,
    public readonly openingTime: string,    // Obligatorio: formato HH:mm
    public readonly closingTime: string,    // Obligatorio: formato HH:mm
    public readonly isActive: boolean,
    public readonly ownerId: string,        // @unique en DB: 1 dueño = 1 local
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
