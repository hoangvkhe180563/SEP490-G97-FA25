using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class Province
{
    public short Id { get; set; }

    public string Name { get; set; } = null!;

    public sbyte CityId { get; set; }

    public City City { get; set; } = null!;

    public List<Commune> Communes { get; set; } = new List<Commune>();
}
