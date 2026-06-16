import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../../../../../shared/middlewares/requireAuth";
import { AuthMeResponseDTO } from "../../../application/dto/AuthMeResponseDTO";
import { PrismaUserRepository } from "../../../../users/infrastructure/persistence/PrismaUserRepository";

const router = Router();
const userRepository = new PrismaUserRepository();

// GET /api/auth/me
router.get("/me", requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      res.status(401).json({ error: "Unauthorized: Missing authentication context" });
      return;
    }

    const user = await userRepository.findByClerkId(clerkId);

    if (!user) {
      res.status(404).json({ error: "User profile not found" });
      return;
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
