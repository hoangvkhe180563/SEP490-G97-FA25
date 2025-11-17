using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class AppUserLoginHistory
{
    public long Id { get; set; }

    public Guid UserId { get; set; }

    public DateTime LoginAt { get; set; }

    public DateTime? LogoutAt { get; set; }

    public bool? IsSuccess { get; set; }

    public Guid? SessionId { get; set; }

    public bool? IsActiveSession { get; set; }

    public DateTime? LastSeen { get; set; }

    public virtual AppUser User { get; set; } = null!;
}
