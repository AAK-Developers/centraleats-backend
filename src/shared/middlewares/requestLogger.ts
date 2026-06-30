import { Request, Response, NextFunction } from "express";
import { logger } from "../infrastructure/logging/logger";

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip;
    const userAgent = req.get("user-agent") || "unknown";
    const userId = req.auth?.userId || "anonymous";

    logger.info({
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip,
      userAgent,
      userId,
    }, `${req.method} ${req.originalUrl || req.url} - ${res.statusCode} (${duration}ms)`);
  });
  next();
};
