using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class ClassNotificationReadStatus
{
    public int NotificationId { get; set; }

    public Guid AppUserId { get; set; }

    public bool IsRead { get; set; }

    public DateTime ReadAt { get; set; }

    public virtual ClassNotification Notification { get; set; } = null!;
}
