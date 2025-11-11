namespace StudyHub.Backend.Domain.Entities;

public class Lesson
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public int ChapterId { get; set; }
    public string Type { get; set; } = null!;
    public string? Duration { get; set; }
    public string? Description { get; set; }
    public DateTime? PostDate { get; set; }
    public bool? IsPreview { get; set; }
    public int? ResourceId { get; set; }
    public Chapter Chapter { get; set; } = null!;
    public LessonVideo? LessonVideo { get; set; }
    public LessonReading? LessonReading { get; set; }
    public List<Progress> Progresses { get; set; } = new List<Progress>();
    public LessonResource? Resource { get; set; }
    // interactive questions attached to this lesson (not persisted by this class directly)
    public List<InteractiveQuestion>? InteractiveQuestions { get; set; }

}