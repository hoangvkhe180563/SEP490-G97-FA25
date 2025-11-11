using StudyHub.Backend.UseCases.Dtos;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class StatisticsService
    {
        private readonly IStatisticsRepository _repo;

        public StatisticsService(IStatisticsRepository repo)
        {
            _repo = repo;
        }

        public AccountsOverviewDto GetAccountsOverview(string period = "day", int range = 30)
        {
            return _repo.GetAccountsOverview(period, range);
        }

        public AccountRecoveryStatsDto GetAccountRecoveryStats()
        {
            return _repo.GetAccountRecoveryStats();
        }
    }
}
