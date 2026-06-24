import { createClerkClient } from "@clerk/backend";
import crypto from "crypto";
import { IVendorRepository } from "../../domain/repositories/IVendorRepository";
import { PrismaUserRepository } from "../../../users/infrastructure/persistence/PrismaUserRepository";
import { Vendor } from "../../domain/entities/Vendor";
import { env } from "../../../../config/env";
import { AppError } from "../../../../shared/errors/AppError";

import { IStorageRepository } from "../../../../shared/domain/ports/storage.repository";

interface RegisterVendorDTO {
  clerkId: string;
  name: string;
  description?: string;
  location?: string;
  phone?: string;
  openingTime?: string;
  closingTime?: string;
  image?: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  };
}

const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

export class RegisterVendorUseCase {
  private readonly userRepository = new PrismaUserRepository();

  constructor(
    private readonly vendorRepository: IVendorRepository,
    private readonly storageRepository: IStorageRepository
  ) {}

  async execute(dto: RegisterVendorDTO): Promise<Vendor> {
    const user = await this.userRepository.findByClerkId(dto.clerkId);

    if (!user) {
      throw new AppError("User not found in system. Please select a role first.", 404);
    }

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

    const vendorId = crypto.randomUUID(); // Generate early to use in storage path

    let logoUrl: string | null = null;
    if (dto.image) {
      logoUrl = await this.storageRepository.uploadImage(
        dto.image.buffer,
        dto.image.originalname,
        dto.image.mimetype,
        'centraleats-media', // Unified bucket for all media
        `vendors/${vendorId}/logo` // Folder path guarantees ownership separation
      );
    }

    const vendorEntity = Vendor.create({
      id: vendorId,
      name: dto.name,
      description: dto.description || null,
      location: dto.location || "",
      phone: dto.phone || "",
      openingTime: dto.openingTime || "",
      closingTime: dto.closingTime || "",
      logoUrl,
      ownerId: user.id,
    });

    const vendor = await this.vendorRepository.create(vendorEntity);

    return vendor;
  }
}
