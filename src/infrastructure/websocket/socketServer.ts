import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

import { env } from "../../config/env";
import { getAllowedOrigins } from "../../config/cors";

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
  });

  io.on("connection", (socket) => {
    socket.on("disconnect", () => {
      // placeholder for connection cleanup
    });
  });

  return io;
};
