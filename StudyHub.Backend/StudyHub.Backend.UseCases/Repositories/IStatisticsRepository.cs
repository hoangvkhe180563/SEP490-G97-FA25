using StudyHub.Backend.UseCases.Dtos;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IStatisticsRepository
    {
        AccountsOverviewDto GetAccountsOverview(string period = "day", int range = 30, int? schoolId = null);
        AccountRecoveryStatsDto GetAccountRecoveryStats(int? schoolId = null);
        // retention: percentage of users in cohort [cohortStart..cohortEnd] who returned after 'returnAfterDays' days
        RetentionDto GetRetention(DateTime cohortStart, DateTime cohortEnd, int returnAfterDays, int? schoolId = null);
        AverageLoginFrequencyDto GetAverageLoginFrequency(DateTime start, DateTime end, int? schoolId = null);
        List<HourCountDto> GetPeakHours(DateTime? start, DateTime? end, int top = 5, int? schoolId = null);
        PagedResultDto<DateCountDto> GetDAU(DateTime start, DateTime end, int page = 1, int pageSize = 100, int? schoolId = null);
        PagedResultDto<DateCountDto> GetMAU(DateTime start, DateTime end, int page = 1, int pageSize = 100, int? schoolId = null);

        // LLM history based statistics
        List<StudentQuestionStatsDto> GetLlmQuestionsByStudent(DateTime? start, DateTime? end, int top = 100);
        List<DateCountDto> GetLlmQuestionsTimeSeries(string period, DateTime start, DateTime end);
        List<HourCountDto> GetLlmPeakHoursForLlm(DateTime? start, DateTime? end, int top = 5);
        List<SubjectCountDto> GetTopSubjects(DateTime? start, DateTime? end, int top = 10);

        // QA conversation statistics
        int GetTotalQAConversations(DateTime? start, DateTime? end);
        List<SubjectCountDto> GetQAConversationCountBySubject(DateTime? start, DateTime? end, int top = 10);
        List<TopicCountDto> GetQAConversationCountByTopic(DateTime? start, DateTime? end, int top = 10);
        long GetTotalQAMessages(DateTime? start, DateTime? end);

        double GetAveragePaidConversationsPerDay(DateTime? start, DateTime? end);
        double GetAveragePaidConversationsPerWeek(DateTime? start, DateTime? end);
        double GetAveragePaidConversationsPerMonth(DateTime? start, DateTime? end);

        double GetAverageMessagesPerDay(DateTime? start, DateTime? end);
        double GetAverageMessagesPerWeek(DateTime? start, DateTime? end);
        double GetAverageMessagesPerMonth(DateTime? start, DateTime? end);

        List<TeacherStatsDto> GetTopTeachers(DateTime? start, DateTime? end, int top = 10, string sortBy = "response");
        List<StudentQuestionStatsDto> GetTopQaStudents(DateTime? start, DateTime? end, int top = 10);
        List<SubjectCountDto> GetTopQaSubjects(DateTime? start, DateTime? end, int top = 10);

        // Top recommended items (courses/documents) parsed from stored LLM responses
        List<RecommendedItemCountDto> GetTopRecommendedCourses(DateTime? start, DateTime? end, int top = 10);
        List<RecommendedItemCountDto> GetTopRecommendedDocuments(DateTime? start, DateTime? end, int top = 10);

        TokenSummaryDto GetTokenSummary(DateTime? start, DateTime? end);
        // Token breakdown by period: "day" | "week" | "month"
        List<DateTokenDto> GetTokenByPeriod(string period, DateTime? start, DateTime? end);
        // Backwards-compatible helper
        List<DateTokenDto> GetTokenByMonth(DateTime? start, DateTime? end);
        List<UserTokenDto> GetTopTokenUsers(DateTime? start, DateTime? end, int top = 10);
    }
}
