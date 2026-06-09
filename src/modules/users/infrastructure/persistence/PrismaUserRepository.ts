import { prisma } from "../../../../infrastructure/database/prismaClient";
import { User } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { UserRole } from "@prisma/client";

export class PrismaUserRepository implements IUserRepository {
  private toDomain(prismaUser: any): User {
    return new User(
      prismaUser.id,
      prismaUser.clerkId,
      prismaUser.email,
      prismaUser.fullName,
      prismaUser.avatarUrl,
      prismaUser.role as "STUDENT" | "VENDOR" | "ADMIN",
      prismaUser.isActive,
      prismaUser.createdAt,
      prismaUser.updatedAt
    );
  }

  async findById(id: string): Promise<User | null> {
    const prismaUser = await prisma.user.findUnique({
      where: { id },
    });
    return prismaUser ? this.toDomain(prismaUser) : null;
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    const prismaUser = await prisma.user.findUnique({
      where: { clerkId },
    });
    return prismaUser ? this.toDomain(prismaUser) : null;
  }

  async create(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const prismaUser = await prisma.user.create({
      data: {
        clerkId: user.clerkId,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role as UserRole,
        isActive: user.isActive,
      },
    });
    return this.toDomain(prismaUser);
  }

  async update(id: string, data: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>): Promise<User> {
    const prismaUser = await prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
        role: data.role as UserRole,
        isActive: data.isActive,
      },
    });
    return this.toDomain(prismaUser);
  }
  async upsertByExternalId(externalId: string, data: Partial<User>): Promise<User> {
    const prismaUser = await prisma.user.upsert({
      where: { clerkId: externalId },
      create: {
        clerkId: externalId,
        email: data.email || "",
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
        role: "STUDENT",
      },
      update: {
        email: data.email,
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
      },
    });
    return this.toDomain(prismaUser);
  }

  async deleteByExternalId(externalId: string): Promise<void> {
    await prisma.user.deleteMany({
      where: { clerkId: externalId },
    });
  }
}
