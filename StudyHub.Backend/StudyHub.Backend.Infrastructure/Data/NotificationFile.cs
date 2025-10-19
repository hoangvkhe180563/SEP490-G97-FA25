using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class NotificationFile
{
    public int Id { get; set; }

    public string FileName { get; set; } = null!;

    public string FileUrl { get; set; } = null!;

    public virtual ICollection<ClassNotificationFileMapping> ClassNotificationFileMappings { get; set; } = new List<ClassNotificationFileMapping>();
}
