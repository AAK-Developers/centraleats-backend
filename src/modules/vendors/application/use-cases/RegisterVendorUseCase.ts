import { createClerkClient } from "@clerk/backend";
import { IVendorRepository } from "../../domain/repositories/IVendorRepository";
import { PrismaUserRepository } from "../../../users/infrastructure/persistence/PrismaUserRepository";
import { Vendor } from "../../domain/entities/Vendor";
import { env } from "../../../../config/env";
import { AppError } from "../../../../shared/errors/AppError";

interface RegisterVendorDTO {
  clerkId: string;
  name: string;
  description?: string;
  location?: string;
  phone?: string;
}

const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

export class RegisterVendorUseCase {
  private readonly userRepository = new PrismaUserRepository();

  constructor(private readonly vendorRepository: IVendorRepository) {}

  async execute(dto: RegisterVendorDTO): Promise<Vendor> {
    const user = await this.userRepository.findByClerkId(dto.clerkId);

    if (!user) {
      throw new AppError("User not found in system. Please select a role first.", 404);
    }

    // Ensure the user's role is VENDOR
    if (user.role !== "VENDOR") {
      await this.userRepository.update(user.id, { role: "VENDOR" });
      try {
        await clerkClient.users.updateUserMetadata(dto.clerkId, {
          publicMetadata: {
            role: "vendor",
          },
        });
      } catch (error: any) {
        console.error(`[RegisterVendorUseCase] Failed to update Clerk user metadata: ${error.message}`);
      }
    }

    const vendor = await this.vendorRepository.create({
      name: dto.name,
      description: dto.description || null,
      location: dto.location || null,
      phone: dto.phone || null,
      isActive: true,
      ownerId: user.id,
    });

    return vendor;
  }
}
