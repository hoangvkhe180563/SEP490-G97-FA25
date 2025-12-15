using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class AppRole
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<AppPolicy> AppPolicies { get; set; } = new List<AppPolicy>();

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<AppUser> Users { get; set; } = new List<AppUser>();
}
