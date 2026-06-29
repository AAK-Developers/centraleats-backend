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
      res.status(401).json({ error: "Unauthorized: Missing authentication context" });
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
          res.status(400).json({ error: "Email is required and could not be retrieved from Clerk" });
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
        res.status(404).json({ error: `User profile not found in system and auto-registration failed: ${err.message}` });
        return;
      }
    }

    if (!user.isActive) {
      res.status(403).json({ error: "Forbidden: Account is deactivated" });
      return;
    }

    const responseDto = new AuthMeResponseDTO(user);

    res.status(200).json(responseDto);
  } catch (error) {
    next(error);
  }
});

export default router;
