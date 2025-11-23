using StudyHub.Backend.Api.Dtos.QuestionDTOS;

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
        public bool IsMultipleAttempts { get; set; }
        public List<QuestionDetailsDto> Questions { get; set; } = new List<QuestionDetailsDto>();
        public int TotalQuestions { get; set; }
    }
}
