export class Vendor {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly location: string | null,
    public readonly phone: string | null,
    public readonly isActive: boolean,
    public readonly ownerId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
