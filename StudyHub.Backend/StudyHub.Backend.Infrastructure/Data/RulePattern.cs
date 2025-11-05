using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class RulePattern
{
    public int Id { get; set; }

    public int RuleId { get; set; }

    public string Pattern { get; set; } = null!;

    public bool? IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public Guid CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public Guid? UpdatedBy { get; set; }

    public virtual AppUser CreatedByNavigation { get; set; } = null!;

    public virtual ForumRule Rule { get; set; } = null!;

    public virtual ICollection<ViolationRecord> ViolationRecords { get; set; } = new List<ViolationRecord>();
}
