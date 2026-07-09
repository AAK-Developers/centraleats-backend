import { NextFunction, Request, Response } from "express";

import { AppError } from "../errors/AppError";
import { JSend } from "../utils/JSend";

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof AppError) {
    JSend.error(res, error.statusCode, error.message);
    return;
  }

  // eslint-disable-next-line no-console
  console.error(error);

  JSend.error(res, 500, "An unexpected error occurred.");
};
