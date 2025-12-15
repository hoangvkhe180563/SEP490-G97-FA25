using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class NotificationGroup
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public Guid? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual AppUser? CreatedByNavigation { get; set; }

    public virtual ICollection<NotificationGroupMember> NotificationGroupMembers { get; set; } = new List<NotificationGroupMember>();

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
