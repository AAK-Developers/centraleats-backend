import cors from "cors";
import express from "express";

import { env } from "./config/env";
import { createOrdersModuleRouter } from "./modules/orders";
import { createCatalogModuleRouter } from "./modules/catalog";
import { createVendorModuleRouter } from "./modules/vendors";
import clerkWebhookRoutes from "./modules/users/presentation/http/routes/clerkWebhookRoutes";
import { errorHandler } from "./shared/middlewares/errorHandler";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
    }),
  );

  // Webhook route must come before express.json() to preserve the raw body for Svix validation
  app.use("/api/webhooks/clerk", express.raw({ type: "application/json" }), clerkWebhookRoutes);

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api/orders", createOrdersModuleRouter());
  app.use("/api", createCatalogModuleRouter());
  app.use("/api/vendors", createVendorModuleRouter());

  app.use(errorHandler);

  return app;
};
