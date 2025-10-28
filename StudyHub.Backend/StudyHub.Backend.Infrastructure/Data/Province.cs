using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class Province
{
    public short Id { get; set; }

    public string Name { get; set; } = null!;

    public sbyte CityId { get; set; }

    public virtual City City { get; set; } = null!;

    public virtual ICollection<Commune> Communes { get; set; } = new List<Commune>();
}
