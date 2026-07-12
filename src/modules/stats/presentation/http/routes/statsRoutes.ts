import { Router } from "express";
import { getDashboardStatsController } from "../../../dependencies";

import { requireAuth } from "../../../../../shared/middlewares/requireAuth";
import { requireRole } from "../../../../../shared/middlewares/requireRole";

const router = Router();

/**
 * GET /api/stats/dashboard
 */
router.get(
    "/dashboard",
    requireAuth,
    requireRole(["ADMIN"]),
    getDashboardStatsController.handle
);

export default router;