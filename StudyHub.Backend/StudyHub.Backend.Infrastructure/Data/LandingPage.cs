using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class LandingPage
{
    public int Id { get; set; }

    public int SchoolId { get; set; }

    public string? SchoolLogoUrl { get; set; }

    public sbyte PrimaryColor { get; set; }

    public virtual School School { get; set; } = null!;
}
