using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class ClassNotification
{
    public int Id { get; set; }

    public int ClassId { get; set; }

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public Guid CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public Guid? UpdatedBy { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual Class Class { get; set; } = null!;

    public virtual ICollection<ClassNotificationComment> ClassNotificationComments { get; set; } = new List<ClassNotificationComment>();

    public virtual ICollection<ClassNotificationFileMapping> ClassNotificationFileMappings { get; set; } = new List<ClassNotificationFileMapping>();
}
