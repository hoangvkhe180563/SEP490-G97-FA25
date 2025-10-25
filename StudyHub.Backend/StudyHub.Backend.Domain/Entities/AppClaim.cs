using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Domain.Entities;

public class AppClaim
{
    public Guid UserId { get; set; }

    public Guid RoleId { get; set; }

    public short SubjectId { get; set; }

    public int ClassId { get; set; }

    public Class Class { get; set; } = null!;
    public AppRole Role { get; set; } = null!;
    public Subject Subject { get; set; } = null!;
    public AppUser User { get; set; } = null!;
}
