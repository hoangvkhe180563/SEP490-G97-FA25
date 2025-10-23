using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class ClassNotificationFile
{
    public int Id { get; set; }

    public int NotificationId { get; set; }

    public string FileName { get; set; } = null!;

    public string FileUrl { get; set; } = null!;

    public virtual ClassNotification Notification { get; set; } = null!;
}
