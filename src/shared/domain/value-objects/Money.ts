import { AppError } from "../../../shared/errors/AppError";

/**
 * Money Value Object
 * Implementa la "Arquitectura de Centavos" para garantizar consistencia financiera
 * y erradicar los errores de redondeo IEEE 754 de coma flotante.
 */
export class Money {
  /**
   * @param value Cantidad en centavos enteros (ej: 350 para $3.50)
   */
  private constructor(public readonly value: number) {}

  /**
   * Crea una instancia a partir de un valor en centavos ya validado.
   * Utilizado principalmente desde la capa de persistencia (DB) o desde inputs ya sanitizados.
   */
  public static fromCents(cents: number): Money {
    if (!Number.isInteger(cents)) {
      throw new AppError("Money must be constructed with an integer value representing cents", 500);
    }
    if (cents < 0) {
      throw new AppError("Money amount cannot be negative", 400);
    }
    return new Money(cents);
  }

  /**
   * Convierte la cantidad interna a un string decimal para capas de presentación si fuera necesario.
   * Ej: 350 -> "3.50"
   */
  public toDecimalString(): string {
    return (this.value / 100).toFixed(2);
  }

  /**
   * Suma otra cantidad monetaria
   */
  public add(other: Money): Money {
    return new Money(this.value + other.value);
  }

  /**
   * Multiplica por una cantidad entera (ej: para cálculo de subtotales de Items)
   */
  public multiply(quantity: number): Money {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new AppError("Quantity must be a positive integer", 400);
    }
    return new Money(this.value * quantity);
  }

  /**
   * Compara si es igual a otra cantidad
   */
  public equals(other: Money): boolean {
    return this.value === other.value;
  }
}
