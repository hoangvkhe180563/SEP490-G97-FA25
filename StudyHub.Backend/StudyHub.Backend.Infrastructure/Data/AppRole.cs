using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class AppRole
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<AppClaim> AppClaims { get; set; } = new List<AppClaim>();

    public virtual ICollection<AppPolicy> AppPolicies { get; set; } = new List<AppPolicy>();
}
