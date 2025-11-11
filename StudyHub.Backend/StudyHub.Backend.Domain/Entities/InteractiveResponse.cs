namespace StudyHub.Backend.Domain.Entities;

public class InteractiveResponse
{
    public int Id { get; set; }
    public int LessonId { get; set; }
    public int QuestionId { get; set; }
    public Guid AppUserId { get; set; }
    public string? AnswerText { get; set; }
    public int? SelectedIndex { get; set; }
    public DateTime CreatedAt { get; set; }
}
