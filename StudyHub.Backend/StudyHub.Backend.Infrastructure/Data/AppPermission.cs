using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class AppPermission
{
    public Guid RoleId { get; set; }

    public int ResourceId { get; set; }

    public int ActionId { get; set; }

    public virtual AppAction Action { get; set; } = null!;

    public virtual AppResource Resource { get; set; } = null!;

    public virtual AppRole Role { get; set; } = null!;
}
