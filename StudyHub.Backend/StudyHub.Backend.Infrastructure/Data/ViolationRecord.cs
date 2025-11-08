using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class ViolationRecord
{
    public int Id { get; set; }

    public Guid UserId { get; set; }

    public int SchoolId { get; set; }

    public int? PostId { get; set; }

    public int? CommentId { get; set; }

    public int? MatchedRuleId { get; set; }

    public int? MatchedPatternId { get; set; }

    public int ViolationScore { get; set; }

    public string SourceType { get; set; } = null!;

    public Guid? ReportedBy { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual ForumComment? Comment { get; set; }

    public virtual RulePattern? MatchedPattern { get; set; }

    public virtual ForumRule? MatchedRule { get; set; }

    public virtual ForumPost? Post { get; set; }

    public virtual AppUser? ReportedByNavigation { get; set; }

    public virtual School School { get; set; } = null!;

    public virtual AppUser User { get; set; } = null!;
}
