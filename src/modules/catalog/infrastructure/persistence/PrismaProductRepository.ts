import { prisma } from "../../../../infrastructure/database/prismaClient";
import { Product } from "../../domain/entities/Product";
import { IProductRepository } from "../../domain/repositories/IProductRepository";

export class PrismaProductRepository implements IProductRepository {
  private toDomain(prismaProduct: any): Product {
    return new Product(
      prismaProduct.id,
      prismaProduct.name,
      prismaProduct.description,
      Number(prismaProduct.price.toString()),
      prismaProduct.stock,
      prismaProduct.imageUrl,
      prismaProduct.isAvailable,
      prismaProduct.isActive,
      prismaProduct.vendorId,
      prismaProduct.categoryId,
      prismaProduct.createdAt,
      prismaProduct.updatedAt
    );
  }

  async findById(id: string): Promise<Product | null> {
    const prismaProduct = await prisma.product.findUnique({
      where: { id },
    });
    return prismaProduct ? this.toDomain(prismaProduct) : null;
  }

  async listActive(): Promise<Product[]> {
    const prismaProducts = await prisma.product.findMany({
      where: { isActive: true },
    });
    return prismaProducts.map((p: any) => this.toDomain(p));
  }

  async listByVendorId(vendorId: string): Promise<Product[]> {
    const prismaProducts = await prisma.product.findMany({
      where: { vendorId },
    });
    return prismaProducts.map((p: any) => this.toDomain(p));
  }

  async create(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
    const prismaProduct = await prisma.product.create({
      data: {
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        imageUrl: product.imageUrl,
        isAvailable: product.isAvailable,
        isActive: product.isActive,
        vendorId: product.vendorId,
        categoryId: product.categoryId,
      },
    });
    return this.toDomain(prismaProduct);
  }

  async update(id: string, data: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>): Promise<Product> {
    const prismaProduct = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        imageUrl: data.imageUrl,
        isAvailable: data.isAvailable,
        isActive: data.isActive,
        vendorId: data.vendorId,
        categoryId: data.categoryId,
      },
    });
    return this.toDomain(prismaProduct);
  }
}
