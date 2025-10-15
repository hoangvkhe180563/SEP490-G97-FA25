namespace StudyHub.Backend.Domain.Entities;

public class DocumentCategory
{
    public sbyte Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }
}
