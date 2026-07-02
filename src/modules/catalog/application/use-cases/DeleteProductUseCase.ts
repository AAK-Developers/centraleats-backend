import { IProductRepository } from "../../domain/repositories/IProductRepository";
import { IVendorRepository } from "../../../vendors/domain/repositories/IVendorRepository";
import { PrismaUserRepository } from "../../../users/infrastructure/persistence/PrismaUserRepository";
import { AppError } from "../../../../shared/errors/AppError";
import { publishEvent } from "../../../../config/mqtt";

interface DeleteProductDTO {
  id: string;
  clerkId: string;
}

export class DeleteProductUseCase {
  private readonly userRepository = new PrismaUserRepository();

  constructor(
    private readonly productRepository: IProductRepository,
    private readonly vendorRepository: IVendorRepository
  ) {}

  async execute(dto: DeleteProductDTO): Promise<void> {
    // Step 1: Resolve the authenticated user from Clerk token
    const user = await this.userRepository.findByClerkId(dto.clerkId);
    if (!user) {
      throw new AppError("User not found. Please complete onboarding first.", 404);
    }

    // Step 2: Resolve the vendor from the server using the user's internal ID
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
      throw new AppError("You do not have permission to delete this product", 403);
    }

    // Step 5: Logical delete (set isActive: false, isAvailable: false)
    await this.productRepository.update(product.id, {
      isActive: false,
      isAvailable: false,
    });

    // Step 6: Publish MQTT DELETED event
    try {
      publishEvent("centraleats/dishes/updates", {
        action: "DELETED",
        dishId: product.id,
        restaurantId: product.vendorId,
      });
    } catch (err: any) {
      // Ignored to avoid blocking HTTP flow if MQTT publishing fails
    }
  }
}
