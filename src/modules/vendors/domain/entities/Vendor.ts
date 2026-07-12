import { AppError } from "../../../../shared/errors/AppError";

interface CreateVendorProps {
  id: string;
  name: string;
  description: string | null;
  location: string;
  phone: string;
  logoUrl: string | null;
  openingTime: string;
  closingTime: string;
  estimatedWaitTime: number;
  ownerId: string;
}

/// Vendor entity — Lenguaje Ubicuo v4.0 (Doc. 08.x APPROVED)
/// Mantiene la lógica de creación separada de la reconstitución histórica.
export class Vendor {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly location: string,       // Obligatorio: ubicación en campus UCE
    public readonly phone: string,          // Obligatorio: contacto del local
    public readonly logoUrl: string | null,
    public readonly openingTime: string,    // Obligatorio: formato HH:mm
    public readonly closingTime: string,    // Obligatorio: formato HH:mm
    public readonly estimatedWaitTime: number,
    public readonly isActive: boolean,
    public readonly ownerId: string,        // @unique en DB: 1 dueño = 1 local
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Crea un nuevo Vendor validando las invariantes de negocio.
   * Lanza errores si los datos iniciales son inválidos.
   */
  public static create(props: CreateVendorProps): Vendor {
    if (!props.name || props.name.trim().length < 3) {
      throw new AppError("Vendor name must be at least 3 characters long", 400);
    }
    
    // Validación básica de formato de teléfono (Ecuador: 10 dígitos empezando con 0)
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(props.phone)) {
      throw new AppError("Invalid phone number format. Must be 10 digits starting with 0", 400);
    }

    // Validación de formato HH:mm
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timeRegex.test(props.openingTime) || !timeRegex.test(props.closingTime)) {
      throw new AppError("Opening and closing times must be in HH:mm format", 400);
    }

    return new Vendor(
      props.id,
      props.name,
      props.description,
      props.location,
      props.phone,
      props.logoUrl,
      props.openingTime,
      props.closingTime,
      props.estimatedWaitTime,
      true, // isActive por defecto
      props.ownerId,
      new Date(),
      new Date()
    );
  }

  /**
   * Reconstituye un Vendor desde la base de datos sin aplicar validaciones de creación.
   * Útil para cargar registros históricos que pueden no cumplir con reglas modernas.
   */
  public static reconstitute(
    id: string,
    name: string,
    description: string | null,
    location: string,
    phone: string,
    logoUrl: string | null,
    openingTime: string,
    closingTime: string,
    estimatedWaitTime: number,
    isActive: boolean,
    ownerId: string,
    createdAt: Date,
    updatedAt: Date
  ): Vendor {
    return new Vendor(
      id,
      name,
      description,
      location,
      phone,
      logoUrl,
      openingTime,
      closingTime,
      estimatedWaitTime,
      isActive,
      ownerId,
      createdAt,
      updatedAt
    );
  }
}
