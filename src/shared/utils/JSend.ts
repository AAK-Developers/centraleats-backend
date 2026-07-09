import { Response } from "express";

export interface JSendMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class JSend {
  static success(res: Response, statusCode: number, data: any = null, message?: string, meta?: JSendMeta) {
    const payload: any = {
      status: "success",
      data,
    };
    if (message) payload.message = message;
    if (meta) payload.meta = meta;

    return res.status(statusCode).json(payload);
  }

  static error(res: Response, statusCode: number, message: string) {
    return res.status(statusCode).json({
      status: "error",
      data: null,
      message,
    });
  }
}
