import { createClerkClient } from "@clerk/backend";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { User } from "../../domain/entities/User";
import { env } from "../../../../config/env";
import { AppError } from "../../../../shared/errors/AppError";

const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

export class ResetUserRoleUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(clerkId: string): Promise<User> {
    const user = await this.userRepository.findByClerkId(clerkId);

    if (!user) {
      throw new AppError("User not found in system", 404);
    }

    // Reset database role to default STUDENT
    const updatedUser = await this.userRepository.update(user.id, {
      role: "STUDENT",
    });

    // Clear publicMetadata.role in Clerk
    try {
      await clerkClient.users.updateUserMetadata(clerkId, {
        publicMetadata: {
          role: null,
        },
      });
    } catch (error: any) {
      console.error(`[ResetUserRoleUseCase] Failed to clear Clerk user metadata: ${error.message}`);
    }

    return updatedUser;
  }
}
