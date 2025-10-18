namespace StudyHub.Backend.Domain.Entities;

public class Course : IAuditTrail
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Information { get; set; }

    public string? ImageUrl { get; set; }

    public uint Price { get; set; }

    public sbyte Grade { get; set; }

    public short SubjectId { get; set; }

    public int? SchoolId { get; set; }

    public bool IsFeatured { get; set; }

    public bool? Status { get; set; }
    public List<Chapter> Chapters { get; set; } = new();
}
