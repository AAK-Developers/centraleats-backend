import { IProductRepository } from "../../domain/repositories/IProductRepository";
import { IVendorRepository } from "../../../vendors/domain/repositories/IVendorRepository";
import { PrismaUserRepository } from "../../../users/infrastructure/persistence/PrismaUserRepository";
import { IStorageRepository } from "../../../../shared/domain/ports/storage.repository";
import { Product } from "../../domain/entities/Product";
import { AppError } from "../../../../shared/errors/AppError";

interface CreateProductDTO {
  clerkId: string;
  vendorId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  image?: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  };
}

export class CreateProductUseCase {
  private readonly userRepository = new PrismaUserRepository();

  constructor(
    private readonly productRepository: IProductRepository,
    private readonly vendorRepository: IVendorRepository,
    private readonly storageRepository: IStorageRepository
  ) {}

  async execute(dto: CreateProductDTO): Promise<Product> {
    const user = await this.userRepository.findByClerkId(dto.clerkId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    const vendor = await this.vendorRepository.findById(dto.vendorId);
    if (!vendor) {
      throw new AppError("Vendor not found.", 404);
    }

    if (vendor.ownerId !== user.id) {
      throw new AppError("You do not have permission to add products to this vendor.", 403);
    }

    let imageUrl: string | null = null;
    if (dto.image) {
      imageUrl = await this.storageRepository.uploadImage(
        dto.image.buffer,
        dto.image.originalname,
        dto.image.mimetype,
        'product-images'
      );
    }

    const product = await this.productRepository.create({
      name: dto.name,
      description: dto.description || null,
      price: dto.price,
      stock: dto.stock || 0,
      imageUrl,
      isAvailable: true,
      isActive: true,
      vendorId: dto.vendorId,
      categoryId: dto.categoryId,
    });

    return product;
  }
}
