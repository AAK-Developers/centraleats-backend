import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

import { env } from "../../config/env";
import { getAllowedOrigins } from "../../config/cors";
import { clerkTokenVerifier } from "../external-services/clerk/ClerkTokenVerifier";
import { logger } from "../../shared/infrastructure/logging/logger";
import { prisma } from "../database/prismaClient";

export const ORDER_SOCKET_EVENTS = [
  "order.created",
  "order.preparing",
  "order.ready",
  "order.completed",
  "order.cancelled",
] as const;

export const ORDER_EVENT_DESCRIPTIONS: Record<(typeof ORDER_SOCKET_EVENTS)[number], string> = {
  "order.created": "Emitted when a new order is created.",
  "order.preparing": "Emitted when a vendor starts preparing an order.",
  "order.ready": "Emitted when an order is ready for pickup.",
  "order.completed": "Emitted when an order is collected by the user.",
  "order.cancelled": "Emitted when an order is cancelled.",
};

let ioInstance: SocketIOServer | null = null;

export const configureWebSocket = (httpServer: HttpServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        const allowedOrigins = getAllowedOrigins();
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket"],
  });

  // Authentication middleware using Clerk
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = await clerkTokenVerifier.verify(token);
      
      // Obtener el ID interno de la base de datos (y el vendor si aplica)
      const user = await prisma.user.findUnique({
        where: { clerkId: decoded.userId },
        include: { vendor: true },
      });

      if (!user) {
        return next(new Error("Authentication error: User not found in database"));
      }

      socket.data = { 
        ...socket.data, 
        userId: user.id,
        vendorId: user.vendor?.id,
      };
      next();
    } catch (err: any) {
      logger.error(err, "❌ Socket authentication failed:");
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    const vendorId = socket.data.vendorId;
    logger.info(`Cliente conectado: ${socket.id} (DB User ID: ${userId})`);

    // Automatically join secure user room
    if (userId) {
      socket.join(`user_${userId}`);
      socket.join(userId);
      logger.info(`Cliente ${socket.id} se unió automáticamente a la sala: user_${userId}`);
    }

    // Automatically join vendor room if the user owns a restaurant
    if (vendorId) {
      socket.join(`user_${vendorId}`);
      socket.join(vendorId);
      logger.info(`Cliente ${socket.id} se unió automáticamente a la sala de vendor: user_${vendorId}`);
    }

    // Explicit room joining
    socket.on("join_room", (roomId: string) => {
      socket.join(`user_${roomId}`);
      socket.join(roomId);
      logger.info(`Cliente ${socket.id} se unió a la sala explícita: ${roomId}`);
    });

    socket.on("disconnect", () => {
      logger.info(`Cliente desconectado: ${socket.id}`);
    });
  });

  ioInstance = io;
  return io;
};

export const emitOrderUpdated = (order: {
  id: string;
  userId: string;
  vendorId: string;
  status: string;
}): void => {
  if (!ioInstance) {
    logger.warn("Socket.io is not initialized. Skipping emission.");
    return;
  }

  const payload = { orderId: order.id, status: order.status };

  // Emit to student rooms
  ioInstance.to(`user_${order.userId}`).emit("orderUpdated", payload);
  ioInstance.to(order.userId).emit("orderUpdated", payload);

  // Emit to vendor rooms
  ioInstance.to(`user_${order.vendorId}`).emit("orderUpdated", payload);
  ioInstance.to(order.vendorId).emit("orderUpdated", payload);

  logger.info(
    { orderId: order.id, status: order.status },
    `📡 Evento Socket.io 'orderUpdated' emitido para orden ${order.id}: ${order.status}`
  );

  // Trigger metrics refresh for the vendor dashboard
  emitMetricsUpdated(order.vendorId);
};

export const emitMetricsUpdated = (vendorId: string): void => {
  if (!ioInstance) {
    logger.warn("Socket.io is not initialized. Skipping metrics emission.");
    return;
  }
  const payload = { vendorId, timestamp: Date.now() };
  ioInstance.to(`user_${vendorId}`).emit("metrics.updated", payload);
  ioInstance.to(vendorId).emit("metrics.updated", payload);
  logger.info(
    { vendorId },
    `📊 Evento Socket.io 'metrics.updated' emitido para vendor ${vendorId}`
  );
};
