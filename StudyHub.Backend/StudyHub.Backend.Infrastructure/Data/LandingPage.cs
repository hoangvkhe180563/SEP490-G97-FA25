using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class LandingPage
{
    public int SchoolId { get; set; }

    public string BannerUrl { get; set; } = null!;

    public string Description { get; set; } = null!;

    public virtual ICollection<LandingPageImage> LandingPageImages { get; set; } = new List<LandingPageImage>();

    public virtual School School { get; set; } = null!;
}
