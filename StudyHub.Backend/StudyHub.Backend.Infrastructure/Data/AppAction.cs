using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class AppAction
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<AppPermission> AppPermissions { get; set; } = new List<AppPermission>();
}
