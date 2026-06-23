import crypto from "crypto";
import { IProductRepository } from "../../domain/repositories/IProductRepository";
import { IVendorRepository } from "../../../vendors/domain/repositories/IVendorRepository";
import { PrismaUserRepository } from "../../../users/infrastructure/persistence/PrismaUserRepository";
import { IStorageRepository } from "../../../../shared/domain/ports/storage.repository";
import { Product } from "../../domain/entities/Product";
import { AppError } from "../../../../shared/errors/AppError";

// vendorId is intentionally ABSENT from this DTO.
// The server resolves the vendor from the authenticated clerkId to prevent BOLA/IDOR.
interface CreateProductDTO {
  clerkId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;   // Centavos (Int). e.g. 350 = $3.50
  stock: number;   // Required. No implicit defaults. Auditable inventory.
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
    // Step 1: Resolve the authenticated user from Clerk token
    const user = await this.userRepository.findByClerkId(dto.clerkId);
    if (!user) {
      throw new AppError("User not found. Please complete onboarding first.", 404);
    }

    // Step 2: Resolve the vendor from the server using the user's internal ID.
    // This is the BOLA/IDOR fix: vendorId NEVER comes from the client body.
    const vendor = await this.vendorRepository.findByOwnerId(user.id);
    if (!vendor) {
      throw new AppError(
        "No vendor profile found for this account. Register a vendor first.",
        403
      );
    }

    if (!vendor.isActive) {
      throw new AppError("Your vendor account is currently inactive.", 403);
    }

    // Step 3: Upload image if provided
    let imageUrl: string | null = null;
    if (dto.image) {
      imageUrl = await this.storageRepository.uploadImage(
        dto.image.buffer,
        dto.image.originalname,
        dto.image.mimetype,
        "product-images"
      );
    }

    // Step 4: Persist the product with the server-resolved vendorId
    const productEntity = Product.create({
      id: crypto.randomUUID(),
      name: dto.name,
      description: dto.description || null,
      priceCents: dto.price,
      stock: dto.stock,
      imageUrl,
      vendorId: vendor.id,        // Assigned by server, never from client
      categoryId: dto.categoryId,
    });

    const product = await this.productRepository.create(productEntity);

    return product;
  }
}
