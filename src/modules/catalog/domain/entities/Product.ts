import { AppError } from "../../../../shared/errors/AppError";
import { Money } from "../../../../shared/domain/value-objects/Money";

interface CreateProductProps {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  stock: number;
  imageUrl: string | null;
  vendorId: string;
  categoryId: string;
}

/// Product entity — Lenguaje Ubicuo v4.0 (Doc. 08.x APPROVED)
/// Utiliza Money (Value Object) para operaciones financieras seguras
export class Product {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly price: Money,
    public stock: number,
    public readonly imageUrl: string | null,
    public isAvailable: boolean,
    public isActive: boolean,
    public readonly vendorId: string,
    public readonly categoryId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Crea un nuevo Producto validando invariantes.
   * Asigna isAvailable basado en el stock inicial.
   */
  public static create(props: CreateProductProps): Product {
    if (!props.name || props.name.trim().length < 2) {
      throw new AppError("Product name must be at least 2 characters long", 400);
    }
    
    if (props.stock < 0) {
      throw new AppError("Product stock cannot be negative", 400);
    }

    const price = Money.fromCents(props.priceCents);
    const isAvailable = props.stock > 0;

    return new Product(
      props.id,
      props.name,
      props.description,
      price,
      props.stock,
      props.imageUrl,
      isAvailable,
      true, // isActive por defecto
      props.vendorId,
      props.categoryId,
      new Date(),
      new Date()
    );
  }

  /**
   * Reconstituye un Producto desde la base de datos sin aplicar validaciones de creación.
   * priceCents se convierte a Money Object.
   */
  public static reconstitute(
    id: string,
    name: string,
    description: string | null,
    priceCents: number,
    stock: number,
    imageUrl: string | null,
    isAvailable: boolean,
    isActive: boolean,
    vendorId: string,
    categoryId: string,
    createdAt: Date,
    updatedAt: Date
  ): Product {
    return new Product(
      id,
      name,
      description,
      Money.fromCents(priceCents),
      stock,
      imageUrl,
      isAvailable,
      isActive,
      vendorId,
      categoryId,
      createdAt,
      updatedAt
    );
  }

  /**
   * Extrae los primitivos para persistencia (Object literal).
   * Desempaqueta Money.value -> price (en centavos)
   */
  public toPrimitives() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price.value, // Retorna centavos
      stock: this.stock,
      imageUrl: this.imageUrl,
      isAvailable: this.isAvailable,
      isActive: this.isActive,
      vendorId: this.vendorId,
      categoryId: this.categoryId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Reduce el inventario tras una compra. Valida que no quede negativo.
   */
  public decreaseStock(quantity: number): void {
    if (quantity <= 0) {
      throw new AppError("Quantity to decrease must be positive", 400);
    }
    if (this.stock - quantity < 0) {
      throw new AppError("Insufficient stock", 400);
    }
    
    this.stock -= quantity;
    if (this.stock === 0) {
      this.isAvailable = false;
    }
  }

  /**
   * Cambio de disponibilidad manual por negocio.
   * Si no hay stock, no se puede forzar disponibilidad.
   */
  public changeAvailability(available: boolean): void {
    if (available && this.stock <= 0) {
      throw new AppError("Cannot make product available without stock", 400);
    }
    this.isAvailable = available;
  }
}
