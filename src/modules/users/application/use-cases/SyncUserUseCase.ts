import { AppError } from "../../../../shared/errors/AppError";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { UserSyncDTO } from "../dto/UserSyncDTO";

export class SyncUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(dto: UserSyncDTO): Promise<void> {
    if (dto.eventType === 'created' || dto.eventType === 'updated') {
      if (!dto.email) {
        throw new AppError("Email is required for user creation and update", 400);
      }

      await this.userRepository.upsertByExternalId(dto.externalId, {
        email: dto.email,
        fullName: dto.fullName,
        avatarUrl: dto.avatarUrl,
      });
    } else if (dto.eventType === 'deleted') {
      await this.userRepository.deleteByExternalId(dto.externalId);
    } else {
      throw new AppError(`Unknown event type: ${dto.eventType}`, 400);
    }
  }
}
