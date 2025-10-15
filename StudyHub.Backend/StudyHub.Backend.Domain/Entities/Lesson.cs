namespace StudyHub.Backend.Domain.Entities;

public class Lesson
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public int ChapterId { get; set; }

    public bool? Status { get; set; }

    public string Type { get; set; } = null!;
}
