namespace StudyHub.Backend.Domain.Entities.Exam
{
    public abstract class Question
    {
        public string Id { get; set; } = string.Empty;
        public required string QuestionText { get; set; } = string.Empty;
        public required QuestionType Type { get; set; }
        public int? SubjectId { get; set; }
        public int? Grade { get; set; }
    }
}
