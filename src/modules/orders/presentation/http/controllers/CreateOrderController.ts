import { Request, Response } from "express";

import { CreateOrderUseCase, createOrderSchema } from "../../../application/use-cases/CreateOrderUseCase";
import { validateRequestBody } from "../../../../../shared/validation/validateSchema";

export class CreateOrderController {
  constructor(private readonly createOrderUseCase: CreateOrderUseCase) {}

  handle = async (req: Request, res: Response): Promise<Response> => {
    const input = validateRequestBody(createOrderSchema, req);
    const order = await this.createOrderUseCase.execute(input);

    return res.status(201).json(order);
  };
}
