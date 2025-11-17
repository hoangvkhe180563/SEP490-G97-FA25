using System;

namespace StudyHub.Backend.Domain.Entities;

public class AppUserClass
{
    public Guid UserId { get; set; }

    public int ClassId { get; set; }

    public DateTime JoinDate { get; set; }

    public string Status { get; set; } = string.Empty;

    public Class? Class { get; set; }

    public AppUser? User { get; set; }
}
