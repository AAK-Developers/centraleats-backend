import { PrismaStatsRepository } from "./infraestructure/persistence/PrismaStatsRepository";
import { GetDashboardStatsUseCase } from "./aplication/use-cases/GetDashboardStatsUseCase";
import { GetDashboardStatsController } from "./presentation/http/controllers/GetDashboardStatsController";

const statsRepository = new PrismaStatsRepository();

const getDashboardStatsUseCase =
    new GetDashboardStatsUseCase(statsRepository);

export const getDashboardStatsController =
    new GetDashboardStatsController(getDashboardStatsUseCase);