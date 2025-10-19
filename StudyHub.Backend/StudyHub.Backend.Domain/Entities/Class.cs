namespace StudyHub.Backend.Domain.Entities;

public class Class : IAuditTrail
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public short? SubjectId { get; set; }

    public string? Description { get; set; }
}
