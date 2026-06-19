export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly price: number,
    public readonly stock: number,
    public readonly imageUrl: string | null,
    public readonly isAvailable: boolean,
    public readonly isActive: boolean,
    public readonly vendorId: string,
    public readonly categoryId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
