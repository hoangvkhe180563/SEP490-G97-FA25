namespace StudyHub.Backend.Domain.Entities;

public class Chapter
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public int CourseId { get; set; }
    public string? Description { get; set; }

    public DateTime? PostDate { get; set; }
    public Course Course { get; set; } = null!;
    public List<Lesson> Lessons { get; set; } = new();
}
