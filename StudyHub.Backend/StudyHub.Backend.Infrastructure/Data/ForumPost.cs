using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class ForumPost
{
    public int Id { get; set; }

    public int SchoolId { get; set; }

    public short SubjectId { get; set; }

    public int? FlairId { get; set; }

    public string Title { get; set; } = null!;

    public string Content { get; set; } = null!;

    public int TotalViolationScore { get; set; }

    public bool IsHidden { get; set; }

    public bool? Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public Guid CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public Guid? UpdatedBy { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual AppUser CreatedByNavigation { get; set; } = null!;

    public virtual ForumFlair? Flair { get; set; }

    public virtual ICollection<ForumAttachment> ForumAttachments { get; set; } = new List<ForumAttachment>();

    public virtual ICollection<ForumComment> ForumComments { get; set; } = new List<ForumComment>();

    public virtual School School { get; set; } = null!;

    public virtual Subject Subject { get; set; } = null!;

    public virtual ICollection<ViolationRecord> ViolationRecords { get; set; } = new List<ViolationRecord>();
}
