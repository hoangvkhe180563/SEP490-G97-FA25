using StudyHub.Backend.UseCases.Dtos;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IStatisticsRepository
    {
        AccountsOverviewDto GetAccountsOverview(string period = "day", int range = 30);
        AccountRecoveryStatsDto GetAccountRecoveryStats();
        // retention: percentage of users in cohort [cohortStart..cohortEnd] who returned after 'returnAfterDays' days
        RetentionDto GetRetention(DateTime cohortStart, DateTime cohortEnd, int returnAfterDays);
        AverageLoginFrequencyDto GetAverageLoginFrequency(DateTime start, DateTime end);
        List<HourCountDto> GetPeakHours(DateTime? start, DateTime? end, int top = 5);
        PagedResultDto<DateCountDto> GetDAU(DateTime start, DateTime end, int page = 1, int pageSize = 100);
        PagedResultDto<DateCountDto> GetMAU(DateTime start, DateTime end, int page = 1, int pageSize = 100);
    }
}
