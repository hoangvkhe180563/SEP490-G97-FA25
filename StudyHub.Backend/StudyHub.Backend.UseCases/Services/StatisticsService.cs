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

        public RetentionDto GetRetention(DateTime cohortStart, DateTime cohortEnd, int returnAfterDays)
        {
            return _repo.GetRetention(cohortStart, cohortEnd, returnAfterDays);
        }

        public AverageLoginFrequencyDto GetAverageLoginFrequency(DateTime start, DateTime end)
        {
            return _repo.GetAverageLoginFrequency(start, end);
        }

        public List<HourCountDto> GetPeakHours(DateTime? start, DateTime? end, int top = 5)
        {
            return _repo.GetPeakHours(start, end, top);
        }

        public PagedResultDto<DateCountDto> GetDAU(DateTime start, DateTime end, int page = 1, int pageSize = 100)
        {
            return _repo.GetDAU(start, end, page, pageSize);
        }

        public PagedResultDto<DateCountDto> GetMAU(DateTime start, DateTime end, int page = 1, int pageSize = 100)
        {
            return _repo.GetMAU(start, end, page, pageSize);
        }
    }
}
