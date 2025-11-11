namespace StudyHub.Backend.Domain.Entities.Exam
{
    public class ExamAnswer
    {
        public required string QuestionId { get; set; } = string.Empty;
        public required string JsonAnswers { get; set; } = string.Empty;
        public required bool IsCorrect { get; set; }
    }
}
