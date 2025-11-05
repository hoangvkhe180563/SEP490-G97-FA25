using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class ForumRule
{
    public int Id { get; set; }

    public int SchoolId { get; set; }

    public string Name { get; set; } = null!;

    public string RuleType { get; set; } = null!;

    public string Severity { get; set; } = null!;

    public int ViolationScore { get; set; }

    public string? Description { get; set; }

    public bool? IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public Guid CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public Guid? UpdatedBy { get; set; }

    public virtual AppUser CreatedByNavigation { get; set; } = null!;

    public virtual ICollection<RulePattern> RulePatterns { get; set; } = new List<RulePattern>();

    public virtual School School { get; set; } = null!;

    public virtual ICollection<ViolationRecord> ViolationRecords { get; set; } = new List<ViolationRecord>();
}
