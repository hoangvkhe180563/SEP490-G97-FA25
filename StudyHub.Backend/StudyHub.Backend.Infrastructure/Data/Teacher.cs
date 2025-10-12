using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class Teacher
{
    public int Id { get; set; }

    public Guid AppUserId { get; set; }

    public bool Gender { get; set; }

    public string? PhoneNumber { get; set; }

    public DateOnly? Dob { get; set; }

    public bool IsFeatured { get; set; }

    public ulong Wallet { get; set; }

    public virtual AppUser AppUser { get; set; } = null!;
}
