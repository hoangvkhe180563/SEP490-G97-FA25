using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class AppRole
{
    public Guid Id { get; set; }

    public string? Name { get; set; }

    public virtual ICollection<AppClaim> AppClaims { get; set; } = new List<AppClaim>();

    public virtual ICollection<AppPermission> AppPermissions { get; set; } = new List<AppPermission>();

    public virtual ICollection<AppUser> Users { get; set; } = new List<AppUser>();
}
