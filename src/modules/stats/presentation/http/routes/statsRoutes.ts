import { Router } from "express";
import cors from "cors";
import { getDashboardStatsController } from "../../../dependencies";

const router = Router();

/**
 * GET /api/stats/dashboard
 */
router.get(
    "/dashboard",
    cors({ origin: "*" }),
    getDashboardStatsController.handle
);

export default router;