namespace StudyHub.Backend.Domain.Entities;

public class Lesson
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public int ChapterId { get; set; }
    public bool? Status { get; set; }
    public string Type { get; set; } = null!;
    public LessonVideo? LessonVideo { get; set; }
    public LessonReading? LessonReading { get; set; }

    public string? Duration { get; set; }
    public string? Description { get; set; }
    public DateTime? PostDate { get; set; }
    public bool? IsPreview { get; set; }
}