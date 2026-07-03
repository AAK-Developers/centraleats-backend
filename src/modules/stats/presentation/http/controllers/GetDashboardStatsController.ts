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

            res.status(200).json({
                success: true,
                data: dashboard,
            });

        } catch (error) {

            next(error);

        }

    };

}