import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

import { env } from "../../config/env";
import { getAllowedOrigins } from "../../config/cors";
import { clerkTokenVerifier } from "../external-services/clerk/ClerkTokenVerifier";
import { logger } from "../../shared/infrastructure/logging/logger";

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
      socket.data = { ...socket.data, userId: decoded.userId };
      next();
    } catch (err: any) {
      logger.error(err, "❌ Socket authentication failed:");
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    logger.info(`Cliente conectado: ${socket.id} (User: ${userId})`);

    // Automatically join secure user room
    if (userId) {
      socket.join(`user_${userId}`);
      socket.join(userId);
      logger.info(`Cliente ${socket.id} se unió automáticamente a la sala: user_${userId}`);
    }

    // Explicit room joining
    socket.on("join_room", (roomId: string) => {
      socket.join(`user_${roomId}`);
      socket.join(roomId);
      logger.info(`Cliente ${socket.id} se unió a la sala: ${roomId}`);
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
};
