using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class Commune
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public sbyte CityId { get; set; }

    public virtual ICollection<AppUser> AppUsers { get; set; } = new List<AppUser>();

    public virtual City City { get; set; } = null!;

    public virtual ICollection<School> Schools { get; set; } = new List<School>();
}
