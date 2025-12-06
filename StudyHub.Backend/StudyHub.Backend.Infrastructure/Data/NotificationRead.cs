using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class NotificationRead
{
    public Guid NotificationId { get; set; }

    public Guid UserId { get; set; }

    public bool IsRead { get; set; }

    public DateTime? ReadAt { get; set; }

    public DateTime DeliveredAt { get; set; }

    public virtual Notification Notification { get; set; } = null!;

    public virtual AppUser User { get; set; } = null!;
}
