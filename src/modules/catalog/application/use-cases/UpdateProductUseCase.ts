import { IProductRepository } from "../../domain/repositories/IProductRepository";
import { IVendorRepository } from "../../../vendors/domain/repositories/IVendorRepository";
import { PrismaUserRepository } from "../../../users/infrastructure/persistence/PrismaUserRepository";
import { IStorageRepository } from "../../../../shared/domain/ports/storage.repository";
import { Product } from "../../domain/entities/Product";
import { AppError } from "../../../../shared/errors/AppError";
import { Money } from "../../../../shared/domain/value-objects/Money";
import { PrismaCategoryRepository } from "../../infrastructure/persistence/PrismaCategoryRepository";
import { publishEvent } from "../../../../config/mqtt";

interface UpdateProductDTO {
  id: string;
  clerkId: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: number;   // Centavos (Int). e.g. 350 = $3.50
  stock: number;
  isAvailable: boolean;
  isActive: boolean;
  image?: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  };
}

export class UpdateProductUseCase {
  private readonly userRepository = new PrismaUserRepository();
  private readonly categoryRepository = new PrismaCategoryRepository();

  constructor(
    private readonly productRepository: IProductRepository,
    private readonly vendorRepository: IVendorRepository,
    private readonly storageRepository: IStorageRepository
  ) {}

  async execute(dto: UpdateProductDTO): Promise<Product> {
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

    // Step 3: Find the existing product
    const product = await this.productRepository.findById(dto.id);
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    // Step 4: Validate ownership (BOLA prevention)
    if (product.vendorId !== vendor.id) {
      throw new AppError("You do not have permission to edit this product", 403);
    }

    // Step 5: Upload image if a new one is provided
    let imageUrl = product.imageUrl;
    if (dto.image) {
      imageUrl = await this.storageRepository.uploadImage(
        dto.image.buffer,
        dto.image.originalname,
        dto.image.mimetype,
        "vendor-logos", // Unified bucket for all media
        `vendors/${vendor.id}/products` // Folder path guarantees ownership
      );
    }

    // Step 6: Persist the product updates
    const updatedProduct = await this.productRepository.update(product.id, {
      name: dto.name,
      description: dto.description || null,
      price: Money.fromCents(dto.price),
      stock: dto.stock,
      imageUrl,
      isAvailable: dto.isAvailable,
      isActive: dto.isActive,
      vendorId: product.vendorId,
      categoryId: dto.categoryId,
    });

    try {
      if (updatedProduct.isActive) {
        const category = await this.categoryRepository.findById(updatedProduct.categoryId);
        publishEvent("centraleats/dishes/updates", {
          action: "UPDATED",
          dish: {
            id: updatedProduct.id,
            name: updatedProduct.name,
            price: updatedProduct.price.value / 100,
            restaurantId: updatedProduct.vendorId,
            category: category ? category.name : "Comida",
          },
        });
      } else {
        publishEvent("centraleats/dishes/updates", {
          action: "DELETED",
          dishId: updatedProduct.id,
          restaurantId: updatedProduct.vendorId,
        });
      }
    } catch (err: any) {
      // Ignored to avoid blocking HTTP flow if MQTT / Category resolution fails
    }

    return updatedProduct;
  }
}
