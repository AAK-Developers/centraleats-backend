import { Router } from "express";
import statsRoutes from "./presentation/http/routes/statsRoutes";

export const createStatsModuleRouter = (): Router => {
    return statsRoutes;
};