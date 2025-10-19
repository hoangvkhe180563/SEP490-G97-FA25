using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class ClassNotificationComment
{
    public int Id { get; set; }

    public int NotificationId { get; set; }

    public Guid UserId { get; set; }

    public string? Content { get; set; }

    public DateTime CreatedAt { get; set; }

    public Guid CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public Guid? UpdatedBy { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual ClassNotification Notification { get; set; } = null!;

    public virtual AppUser User { get; set; } = null!;
}
