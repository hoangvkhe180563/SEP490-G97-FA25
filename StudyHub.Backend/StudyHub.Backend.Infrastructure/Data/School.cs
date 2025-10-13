using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class School
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string Address { get; set; } = null!;

    public int CommuneId { get; set; }

    public virtual Commune Commune { get; set; } = null!;

    public virtual ICollection<Document> Documents { get; set; } = new List<Document>();

    public virtual ICollection<LandingPage> LandingPages { get; set; } = new List<LandingPage>();

    public virtual PaymentInfo? PaymentInfo { get; set; }
}
