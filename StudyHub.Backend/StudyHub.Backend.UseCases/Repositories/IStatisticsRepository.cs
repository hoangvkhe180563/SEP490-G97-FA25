using StudyHub.Backend.UseCases.Dtos;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IStatisticsRepository
    {
        AccountsOverviewDto GetAccountsOverview(string period = "day", int range = 30);
        AccountRecoveryStatsDto GetAccountRecoveryStats();
    }
}
