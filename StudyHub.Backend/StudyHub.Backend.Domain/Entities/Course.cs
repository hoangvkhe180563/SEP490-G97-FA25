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

    public string Status { get; set; } = null!; 
    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }
    public bool IsApproved { get; set; }
    public Subject Subject { get; set; } = null!;

    public List<Chapter> Chapters { get; set; } = new();
    public List<Enrollment> Enrollments { get; set; } = new();
}
