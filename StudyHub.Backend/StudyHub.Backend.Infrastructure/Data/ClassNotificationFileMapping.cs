using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class ClassNotificationFileMapping
{
    public int Id { get; set; }

    public int NotificationId { get; set; }

    public int FileId { get; set; }

    public virtual NotificationFile File { get; set; } = null!;

    public virtual ClassNotification Notification { get; set; } = null!;
}
