namespace StudyHub.Backend.Domain.Entities;

public class ClassNotification:IAuditTrail
{
    public int Id { get; set; }

    public int ClassId { get; set; }

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    public virtual Class Class { get; set; } = null!;

    public virtual ICollection<ClassNotificationComment> ClassNotificationComments { get; set; } = new List<ClassNotificationComment>();

    public virtual ICollection<ClassNotificationFileMapping> ClassNotificationFileMappings { get; set; } = new List<ClassNotificationFileMapping>();
}
