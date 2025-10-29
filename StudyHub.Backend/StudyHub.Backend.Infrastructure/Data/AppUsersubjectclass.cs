using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class AppUsersubjectclass
{
    public Guid UserId { get; set; }

    public short SubjectId { get; set; }

    public int ClassId { get; set; }

    public virtual Class Class { get; set; } = null!;

    public virtual Subject Subject { get; set; } = null!;

    public virtual AppUser User { get; set; } = null!;
}
