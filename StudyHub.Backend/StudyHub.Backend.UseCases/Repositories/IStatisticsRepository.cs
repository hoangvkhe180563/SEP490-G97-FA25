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

        // LLM history based statistics
        List<StudentQuestionStatsDto> GetLlmQuestionsByStudent(DateTime? start, DateTime? end, int top = 100);
        List<DateCountDto> GetLlmQuestionsTimeSeries(string period, DateTime start, DateTime end);
        List<HourCountDto> GetLlmPeakHoursForLlm(DateTime? start, DateTime? end, int top = 5);
        List<SubjectCountDto> GetTopSubjects(DateTime? start, DateTime? end, int top = 10);

        TokenSummaryDto GetTokenSummary(DateTime? start, DateTime? end);
        // Token breakdown by period: "day" | "week" | "month"
        List<DateTokenDto> GetTokenByPeriod(string period, DateTime? start, DateTime? end);
        // Backwards-compatible helper
        List<DateTokenDto> GetTokenByMonth(DateTime? start, DateTime? end);
        List<UserTokenDto> GetTopTokenUsers(DateTime? start, DateTime? end, int top = 10);
    }
}
