using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class NotificationGroupMember
{
    public int GroupId { get; set; }

    public Guid UserId { get; set; }

    public DateTime AddedAt { get; set; }

    public virtual NotificationGroup Group { get; set; } = null!;

    public virtual AppUser User { get; set; } = null!;
}
