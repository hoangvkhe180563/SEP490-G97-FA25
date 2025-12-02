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

        // LLM statistics wrappers
        public List<StudentQuestionStatsDto> GetLlmQuestionsByStudent(DateTime? start, DateTime? end, int top = 100)
        {
            return _repo.GetLlmQuestionsByStudent(start, end, top);
        }

        public List<DateCountDto> GetLlmQuestionsTimeSeries(string period, DateTime start, DateTime end)
        {
            return _repo.GetLlmQuestionsTimeSeries(period, start, end);
        }

        public List<HourCountDto> GetLlmPeakHours(DateTime? start, DateTime? end, int top = 5)
        {
            return _repo.GetLlmPeakHoursForLlm(start, end, top);
        }

        public List<SubjectCountDto> GetTopSubjects(DateTime? start, DateTime? end, int top = 10)
        {
            return _repo.GetTopSubjects(start, end, top);
        }

        // QA conversation statistics
        public int GetTotalQAConversations(DateTime? start, DateTime? end)
        {
            return _repo.GetTotalQAConversations(start, end);
        }

        public List<SubjectCountDto> GetQAConversationCountBySubject(DateTime? start, DateTime? end, int top = 10)
        {
            return _repo.GetQAConversationCountBySubject(start, end, top);
        }

        public List<TopicCountDto> GetQAConversationCountByTopic(DateTime? start, DateTime? end, int top = 10)
        {
            return _repo.GetQAConversationCountByTopic(start, end, top);
        }

        public long GetTotalQAMessages(DateTime? start, DateTime? end)
        {
            return _repo.GetTotalQAMessages(start, end);
        }

        public double GetAveragePaidConversationsPerDay(DateTime? start, DateTime? end)
        {
            return _repo.GetAveragePaidConversationsPerDay(start, end);
        }

        public double GetAveragePaidConversationsPerWeek(DateTime? start, DateTime? end)
        {
            return _repo.GetAveragePaidConversationsPerWeek(start, end);
        }

        public double GetAveragePaidConversationsPerMonth(DateTime? start, DateTime? end)
        {
            return _repo.GetAveragePaidConversationsPerMonth(start, end);
        }

        public double GetAverageMessagesPerDay(DateTime? start, DateTime? end)
        {
            return _repo.GetAverageMessagesPerDay(start, end);
        }

        public double GetAverageMessagesPerWeek(DateTime? start, DateTime? end)
        {
            return _repo.GetAverageMessagesPerWeek(start, end);
        }

        public double GetAverageMessagesPerMonth(DateTime? start, DateTime? end)
        {
            return _repo.GetAverageMessagesPerMonth(start, end);
        }

        public List<TeacherStatsDto> GetTopTeachers(DateTime? start, DateTime? end, int top = 10, string sortBy = "response")
        {
            return _repo.GetTopTeachers(start, end, top, sortBy);
        }

        public List<StudentQuestionStatsDto> GetTopQaStudents(DateTime? start, DateTime? end, int top = 10)
        {
            return _repo.GetTopQaStudents(start, end, top);
        }

        public List<SubjectCountDto> GetTopQaSubjects(DateTime? start, DateTime? end, int top = 10)
        {
            return _repo.GetTopQaSubjects(start, end, top);
        }

        public List<RecommendedItemCountDto> GetTopRecommendedCourses(DateTime? start, DateTime? end, int top = 10)
        {
            return _repo.GetTopRecommendedCourses(start, end, top);
        }

        public List<RecommendedItemCountDto> GetTopRecommendedDocuments(DateTime? start, DateTime? end, int top = 10)
        {
            return _repo.GetTopRecommendedDocuments(start, end, top);
        }

        public TokenSummaryDto GetTokenSummary(DateTime? start, DateTime? end)
        {
            return _repo.GetTokenSummary(start, end);
        }

        public List<DateTokenDto> GetTokenByMonth(DateTime? start, DateTime? end)
        {
            return _repo.GetTokenByPeriod("month", start, end);
        }

        public List<DateTokenDto> GetTokenByPeriod(string period, DateTime? start, DateTime? end)
        {
            return _repo.GetTokenByPeriod(period, start, end);
        }

        public List<UserTokenDto> GetTopTokenUsers(DateTime? start, DateTime? end, int top = 10)
        {
            return _repo.GetTopTokenUsers(start, end, top);
        }
    }
}
