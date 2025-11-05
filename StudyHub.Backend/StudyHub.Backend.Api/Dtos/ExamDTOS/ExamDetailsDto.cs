namespace StudyHub.Backend.Api.Dtos.ExamDTOS
{
    public class ExamDetailsDto
    {
        public int Id { get; set; }
        public required string Title { get; set; } = string.Empty;
        public required string Description { get; set; } = string.Empty;
        public int LessonId { get; set; }
        public int ClassId { get; set; }
        public required DateTime OpenTime { get; set; } = DateTime.Now;
        public DateTime? CloseTime { get; set; }
        public sbyte Attempts { get; set; } = 1;
        public required uint Duration { get; set; }
        public bool Status { get; set; } = true;
        public Guid CreatedBy { get; set; }
        public required bool ShowAnswers { get; set; } = true;
        public required bool ShowCorrectAnswers { get; set; } = false;
        public List<QuestionDetailsDto> Questions { get; set; } = new List<QuestionDetailsDto>();
        public int TotalQuestions { get; set; }
    }

    public class QuestionDetailsDto
    {
        public string QuestionObjectId { get; set; } = string.Empty;
        public string QuestionText { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public List<string> Options { get; set; } = new List<string>();
        public object CorrectAnswer { get; set; } = new object();
    }
}
