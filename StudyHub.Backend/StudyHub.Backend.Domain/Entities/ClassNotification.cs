namespace StudyHub.Backend.Domain.Entities;

public class ClassNotification
{
    public int Id { get; set; }

    public int ClassId { get; set; }

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;
}
