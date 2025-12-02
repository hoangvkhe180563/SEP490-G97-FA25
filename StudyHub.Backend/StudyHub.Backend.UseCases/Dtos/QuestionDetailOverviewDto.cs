using StudyHub.Backend.Domain.Entities.Exam;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class QuestionDetailOverviewDto
    {
        public int SubjectId { get; set; }
        public int Grade { get; set; }
        public QuestionType Type { get; set; }
    }
}
