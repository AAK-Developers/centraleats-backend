import { createServer } from "http";

import { env } from "./config/env";
import { createApp } from "./app";
import { configureWebSocket } from "./infrastructure/websocket/socketServer";
import { prisma } from "./infrastructure/database/prismaClient";

const app = createApp();
const httpServer = createServer(app);

configureWebSocket(httpServer);

async function ensureDefaultCategories() {
  const defaultCategories = [
    {
      id: "06542c60-ad6b-4844-b1b1-3ad6d5baf35a",
      name: "Almuerzos",
      description: "Almuerzos completos y platos fuertes",
    },
    {
      id: "b5003928-6d64-417b-8798-2726d16c8cfb",
      name: "Bebidas",
      description: "Jugos, refrescos y bebidas calientes",
    },
    {
      id: "153a9f76-160d-4895-814d-9831c33088cd",
      name: "Snacks",
      description: "Papas, empanadas y bocadillos",
    },
  ];

  for (const cat of defaultCategories) {
    try {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: {},
        create: {
          id: cat.id,
          name: cat.name,
          description: cat.description,
          isActive: true,
        },
      });
    } catch (err: any) {
      console.error(`[Boot] Failed to ensure category ${cat.name}:`, err.message);
    }
  }
}

httpServer.listen(env.PORT, async () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${env.PORT}`);
  await ensureDefaultCategories();
});
