import { JSend } from "../../../../../shared/utils/JSend";
import { Request, Response, NextFunction } from "express";
import { GetDashboardStatsUseCase } from "../../../aplication/use-cases/GetDashboardStatsUseCase";

export class GetDashboardStatsController {

    constructor(
        private readonly getDashboardStatsUseCase: GetDashboardStatsUseCase
    ) { }

    handle = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {

        try {

            const dashboard =
                await this.getDashboardStatsUseCase.execute();

            JSend.success(res, 200, dashboard);

        } catch (error) {

            next(error);

        }

    };

}