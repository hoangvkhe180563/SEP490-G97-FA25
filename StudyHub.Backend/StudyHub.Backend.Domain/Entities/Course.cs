namespace StudyHub.Backend.Domain.Entities;

public class Course
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

    public DateTime CreatedAt { get; set; }

    public Guid CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public Guid? UpdatedBy { get; set; }

    public DateTime? DeletedAt { get; set; }
    public List<Chapter> Chapters { get; set; } = new();
}
