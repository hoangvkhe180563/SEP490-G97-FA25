using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class AppPolicy
{
    public Guid RoleId { get; set; }

    public int ResourceId { get; set; }

    public string ActionType { get; set; } = null!;

    public string? Condition { get; set; }

    public string? Description { get; set; }

    public virtual AppResource Resource { get; set; } = null!;

    public virtual AppRole Role { get; set; } = null!;
}
