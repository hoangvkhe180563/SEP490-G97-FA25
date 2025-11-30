using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class ClassNotificationComment
{
    public int Id { get; set; }

    public int NotificationId { get; set; }

    public Guid CreatedBy { get; set; }

    public string Content { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual ClassNotification Notification { get; set; } = null!;
}
