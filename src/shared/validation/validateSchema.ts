import { z, ZodError, ZodTypeAny } from "zod";
import { Request } from "express";

import { AppError } from "../errors/AppError";

export const validateSchema = <TSchema extends ZodTypeAny>(
  schema: TSchema,
  payload: unknown,
): z.infer<TSchema> => {
  try {
    return schema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(error.issues.map((issue) => issue.message).join(", "), 422);
    }

    throw error;
  }
};

export const validateRequestBody = <TSchema extends ZodTypeAny>(
  schema: TSchema,
  req: Request,
): z.infer<TSchema> => {
  return validateSchema(schema, req.body);
};
