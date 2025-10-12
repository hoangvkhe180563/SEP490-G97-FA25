using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class AppClaim
{
    public Guid UserId { get; set; }

    public Guid RoleId { get; set; }

    public short SubjectId { get; set; }

    public int ClassId { get; set; }

    public virtual Class Class { get; set; } = null!;

    public virtual AppRole Role { get; set; } = null!;

    public virtual Subject Subject { get; set; } = null!;

    public virtual AppUser User { get; set; } = null!;
}
