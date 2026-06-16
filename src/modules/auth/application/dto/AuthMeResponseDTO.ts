import { User } from "../../../users/domain/entities/User";

export class AuthMeResponseDTO {
  public readonly id: string;
  public readonly email: string;
  public readonly fullName: string | null;
  public readonly avatarUrl: string | null;
  public readonly role: "STUDENT" | "VENDOR" | "ADMIN";
  public readonly isActive: boolean;
  public readonly clerkId: string;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.fullName = user.fullName;
    this.avatarUrl = user.avatarUrl;
    this.role = user.role;
    this.isActive = user.isActive;
    this.clerkId = user.clerkId;
  }
}
