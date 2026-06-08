import cors from "cors";
import express from "express";

import { env } from "./config/env";
import { createOrdersModuleRouter } from "./modules/orders";
import { createCatalogModuleRouter } from "./modules/catalog";
import { createVendorModuleRouter } from "./modules/vendors";
import { requireAuth } from "./shared/middlewares/requireAuth";
import { protectedTestRoutes } from "./modules/auth";
import { errorHandler } from "./shared/middlewares/errorHandler";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
    }),
  );
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api/orders", createOrdersModuleRouter());
  app.use("/api", createCatalogModuleRouter());
  app.use("/api/vendors", createVendorModuleRouter());
  app.use("/api/protected-test", requireAuth, protectedTestRoutes);

  app.use(errorHandler);

  return app;
};
