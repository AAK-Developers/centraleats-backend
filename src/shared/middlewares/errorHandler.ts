import { NextFunction, Request, Response } from "express";

import { AppError } from "../errors/AppError";

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.name,
      message: error.message,
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.error(error);

  res.status(500).json({
    error: "InternalServerError",
    message: "An unexpected error occurred.",
  });
};
