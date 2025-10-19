using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class LandingPageImage
{
    public int Id { get; set; }

    public int LandingPageId { get; set; }

    public string ImageUrl { get; set; } = null!;

    public virtual LandingPage LandingPage { get; set; } = null!;
}
