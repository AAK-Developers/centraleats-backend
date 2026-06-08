// Prisma configuration for CentralEats.
// Connection URLs are managed here (Prisma 7.x requirement).
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx ts-node prisma/seed.ts",
  },
  datasource: {
    // We use DIRECT_URL for migrations if available, otherwise DATABASE_URL
    url: env("DIRECT_URL") || env("DATABASE_URL") || "postgresql://user:pass@localhost:5432/db",
  },
});
