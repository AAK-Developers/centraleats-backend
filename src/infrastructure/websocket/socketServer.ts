import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

import { env } from "../../config/env";

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
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("disconnect", () => {
      // placeholder for connection cleanup
    });
  });

  return io;
};
