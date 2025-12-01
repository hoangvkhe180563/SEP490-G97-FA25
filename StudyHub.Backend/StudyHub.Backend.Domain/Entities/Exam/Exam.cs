namespace StudyHub.Backend.Domain.Entities.Exam
{
    public class Exam
    {
        public int Id { get; set; }
        public required string Title { get; set; } = string.Empty;
        public required string Description { get; set; } = string.Empty;
        public int LessonId { get; set; }
        public int ClassId { get; set; }
        public required DateTime OpenTime { get; set; } = DateTime.Now;
        public DateTime? CloseTime { get; set; }
        public bool IsMultipleAttempts { get; set; }
        public required uint Duration { get; set; }
        public Guid CreatedBy { get; set; }
        public required bool ShowAnswers { get; set; } = true;
        public required bool ShowCorrectAnswers { get; set; } = false;
        public List<Question> Questions { get; set; } = new List<Question>();
        public int TotalQuestions { get; set; }
        public sbyte? NoRandomQuestions { get; set; }
        public sbyte? Grade { get; set; }
        public short? SubjectId { get; set; }
    }
}
