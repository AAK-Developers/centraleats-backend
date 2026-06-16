import { createClerkClient } from "@clerk/backend";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { User } from "../../domain/entities/User";
import { env } from "../../../../config/env";
import { AppError } from "../../../../shared/errors/AppError";

interface RegisterUserDTO {
  clerkId: string;
  role: "STUDENT" | "VENDOR" | "ADMIN";
  email?: string;
  fullName?: string;
  avatarUrl?: string;
}

const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

export class RegisterUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(dto: RegisterUserDTO): Promise<User> {
    const existingUser = await this.userRepository.findByClerkId(dto.clerkId);

    if (existingUser) {
      // If user exists, update their role (and other optional fields if provided)
      const updatedUser = await this.userRepository.update(existingUser.id, {
        role: dto.role,
        fullName: dto.fullName !== undefined ? dto.fullName : existingUser.fullName,
        avatarUrl: dto.avatarUrl !== undefined ? dto.avatarUrl : existingUser.avatarUrl,
      });

      // Update Clerk metadata
      try {
        await clerkClient.users.updateUserMetadata(dto.clerkId, {
          publicMetadata: {
            role: dto.role.toLowerCase(),
          },
        });
      } catch (error: any) {
        console.error(`[RegisterUserUseCase] Failed to update Clerk user metadata: ${error.message}`);
      }

      return updatedUser;
    }

    // If user does not exist, try to get details from Clerk to populate email/details
    let email = dto.email || "";
    let fullName = dto.fullName || null;
    let avatarUrl = dto.avatarUrl || null;

    try {
      const clerkUser = await clerkClient.users.getUser(dto.clerkId);
      if (clerkUser) {
        email = email || clerkUser.emailAddresses[0]?.emailAddress || "";
        fullName = fullName || `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null;
        avatarUrl = avatarUrl || clerkUser.imageUrl || null;
      }
    } catch (error: any) {
      console.warn(`[RegisterUserUseCase] Could not fetch user from Clerk API: ${error.message}`);
    }

    if (!email) {
      throw new AppError("Email is required for user creation, and could not be retrieved", 400);
    }

    // Create the user in the database
    const newUser = await this.userRepository.create({
      clerkId: dto.clerkId,
      email,
      fullName,
      avatarUrl,
      role: dto.role,
      isActive: true,
    });

    // Update Clerk metadata for new user
    try {
      await clerkClient.users.updateUserMetadata(dto.clerkId, {
        publicMetadata: {
          role: dto.role.toLowerCase(),
        },
      });
    } catch (error: any) {
      console.error(`[RegisterUserUseCase] Failed to update Clerk user metadata: ${error.message}`);
    }

    return newUser;
  }
}
