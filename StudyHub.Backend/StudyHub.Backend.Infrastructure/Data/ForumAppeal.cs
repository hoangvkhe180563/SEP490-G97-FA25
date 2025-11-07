using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class ForumAppeal
{
    public int Id { get; set; }

    public Guid UserId { get; set; }

    public int SchoolId { get; set; }

    public string Reason { get; set; } = null!;

    public bool? Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public Guid? UpdatedBy { get; set; }

    public virtual School School { get; set; } = null!;

    public virtual AppUser? UpdatedByNavigation { get; set; }

    public virtual AppUser User { get; set; } = null!;
}
