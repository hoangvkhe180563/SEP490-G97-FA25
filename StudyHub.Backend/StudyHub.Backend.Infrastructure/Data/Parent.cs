using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class Parent
{
    public int Id { get; set; }

    public Guid AppUserId { get; set; }

    public string? PhoneNumber { get; set; }

    public bool Gender { get; set; }

    public DateOnly? Dob { get; set; }

    public string? Address { get; set; }

    public string? StudentRelation { get; set; }

    public virtual AppUser AppUser { get; set; } = null!;
}
