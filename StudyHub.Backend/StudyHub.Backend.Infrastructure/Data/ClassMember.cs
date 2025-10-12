using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class ClassMember
{
    public Guid UserId { get; set; }

    public int ClassId { get; set; }

    public DateTime JoinDate { get; set; }

    public virtual Class Class { get; set; } = null!;

    public virtual AppUser User { get; set; } = null!;
}
