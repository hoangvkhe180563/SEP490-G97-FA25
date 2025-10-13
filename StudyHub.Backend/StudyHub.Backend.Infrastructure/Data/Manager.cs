using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class Manager
{
    public int Id { get; set; }

    public Guid AppUserId { get; set; }

    public string? PhoneNumber { get; set; }

    public virtual AppUser AppUser { get; set; } = null!;
}
