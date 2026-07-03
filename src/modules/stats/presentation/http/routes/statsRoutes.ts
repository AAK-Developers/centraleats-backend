import { Router } from "express";
import { getDashboardStatsController } from "../../../dependencies";

const router = Router();

/**
 * GET /api/stats/dashboard
 */
router.get(
    "/dashboard",
    getDashboardStatsController.handle
);

export default router;