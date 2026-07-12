import {
    DashboardStats,
    IStatsRepository,
} from "../../domain/repositories/IStatsRepository";

export class GetDashboardStatsUseCase {
    constructor(
        private readonly statsRepository: IStatsRepository
    ) { }

    async execute(): Promise<DashboardStats> {
        return await this.statsRepository.getDashboardStats();
    }
}