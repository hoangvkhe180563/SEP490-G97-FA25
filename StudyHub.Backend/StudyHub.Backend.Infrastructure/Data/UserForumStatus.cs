using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class UserForumStatus
{
    public Guid UserId { get; set; }

    public int SchoolId { get; set; }

    public int TotalViolationScore { get; set; }

    public bool IsMute { get; set; }

    public DateTime? MuteUntil { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual School School { get; set; } = null!;

    public virtual AppUser User { get; set; } = null!;
}
