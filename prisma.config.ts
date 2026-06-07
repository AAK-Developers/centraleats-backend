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
    url: env("DIRECT_URL"),
  },
});