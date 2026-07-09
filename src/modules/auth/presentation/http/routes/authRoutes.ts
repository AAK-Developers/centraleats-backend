import { JSend } from "../../../../../shared/utils/JSend";
import { Router, Request, Response, NextFunction } from "express";
import { createClerkClient } from "@clerk/backend";
import { env } from "../../../../../config/env";
import { requireAuth } from "../../../../../shared/middlewares/requireAuth";
import { AuthMeResponseDTO } from "../../../application/dto/AuthMeResponseDTO";
import { PrismaUserRepository } from "../../../../users/infrastructure/persistence/PrismaUserRepository";

const router = Router();
const userRepository = new PrismaUserRepository();
const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

// GET /api/auth/me
router.get("/me", requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      JSend.error(res, 401, "Unauthorized: Missing authentication context");
      return;
    }

    let user = await userRepository.findByClerkId(clerkId);

    // Fallback: If user exists in Clerk but not in local database (webhook failed or delayed)
    if (!user) {
      try {
        let email = "";
        let fullName = null;
        let avatarUrl = null;

        const clerkUser = await clerkClient.users.getUser(clerkId);
        if (clerkUser) {
          email = clerkUser.emailAddresses[0]?.emailAddress || "";
          fullName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null;
          avatarUrl = clerkUser.imageUrl || null;
        }

        if (!email) {
          JSend.error(res, 400, "Email is required and could not be retrieved from Clerk");
          return;
        }

        let role: "STUDENT" | "VENDOR" | "ADMIN" | "PENDING" = "PENDING";
        const clerkRole = clerkUser?.publicMetadata?.role as string | undefined;
        if (clerkRole) {
          const normalized = clerkRole.toUpperCase();
          if (normalized === "STUDENT" || normalized === "VENDOR" || normalized === "ADMIN") {
            role = normalized as "STUDENT" | "VENDOR" | "ADMIN";
          }
        }

        user = await userRepository.create({
          clerkId,
          email,
          fullName,
          avatarUrl,
          role,
          isActive: true,
        });
      } catch (err: any) {
        console.error("[authRoutes] Failed to auto-register user on /me:", err.message);
        JSend.error(res, 404, `User profile not found in system and auto-registration failed: ${err.message}`);
        return;
      }
    }

    if (!user.isActive) {
      JSend.error(res, 403, "Forbidden: Account is deactivated");
      return;
    }

    const responseDto = new AuthMeResponseDTO(user);

    JSend.success(res, 200, responseDto);
  } catch (error) {
    next(error);
  }
});

export default router;
