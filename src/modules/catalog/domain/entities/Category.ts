/// Category entity — Lenguaje Ubicuo v4.0 (Catalog Context)
/// Gestionada exclusivamente por ADMIN.
/// description: campo opcional para mostrar contexto semántico al estudiante.
export class Category {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
