import cors from "cors";
import express from "express";
import path from "path";

import { env } from "./config/env";
import { getAllowedOrigins } from "./config/cors";
import { createOrdersModuleRouter, createStudentModuleRouter } from "./modules/orders";
import { createCatalogModuleRouter } from "./modules/catalog";
import { createVendorModuleRouter } from "./modules/vendors";
import { createUsersModuleRouter } from "./modules/users";
import clerkWebhookRoutes from "./modules/users/presentation/http/routes/clerkWebhookRoutes";
import { requireAuth } from "./shared/middlewares/requireAuth";
import { protectedTestRoutes, authRoutes } from "./modules/auth";
import { errorHandler } from "./shared/middlewares/errorHandler";
import { requestLogger } from "./shared/middlewares/requestLogger";
import { createStatsModuleRouter } from "./modules/stats";

export const createApp = () => {
  const app = express();

  app.use(requestLogger);

  app.use(
    cors({
      origin: (origin, callback) => {
        console.log("ORIGIN =>", origin);
        const allowedOrigins = getAllowedOrigins();
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      credentials: true,
    }),
  );

  // Webhook route must come before express.json() to preserve the raw body for Svix validation
  app.use("/api/webhooks/clerk", express.raw({ type: "application/json" }), clerkWebhookRoutes);

  app.use(express.json());

  // Static files middleware for uploaded images
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api/users", createUsersModuleRouter());
  app.use("/api/student", createStudentModuleRouter());
  app.use("/api/orders", createOrdersModuleRouter());
  app.use("/api", createCatalogModuleRouter());
  app.use("/api/vendors", createVendorModuleRouter());
  app.use("/api/restaurants", createVendorModuleRouter());
  app.use("/api/stats", createStatsModuleRouter());
  app.use("/api/auth", authRoutes);
  app.use("/api/protected-test", requireAuth, protectedTestRoutes);

  app.use(errorHandler);

  return app;
};
