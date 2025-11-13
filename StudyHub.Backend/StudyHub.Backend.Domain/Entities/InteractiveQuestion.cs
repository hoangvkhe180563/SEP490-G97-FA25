namespace StudyHub.Backend.Domain.Entities;

public class InteractiveQuestion
{
    public int Id { get; set; }
    public int LessonId { get; set; }
    public int TimeSec { get; set; }
    public string QuestionText { get; set; } = null!;
    public string Type { get; set; } = "mc"; // 'mc' or 'text'
    public string? OptionsJson { get; set; } // JSON array string for MC options
    public int? CorrectIndex { get; set; }
    public string? CorrectAnswer { get; set; } // expected text answer for 'text' type questions
    public DateTime CreatedAt { get; set; }
}
