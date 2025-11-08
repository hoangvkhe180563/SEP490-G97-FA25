using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class ForumComment
{
    public int Id { get; set; }

    public int PostId { get; set; }

    public int? ParentCommentId { get; set; }

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

    public virtual ICollection<ForumAttachment> ForumAttachments { get; set; } = new List<ForumAttachment>();

    public virtual ICollection<ForumComment> InverseParentComment { get; set; } = new List<ForumComment>();

    public virtual ForumComment? ParentComment { get; set; }

    public virtual ForumPost Post { get; set; } = null!;

    public virtual ICollection<ViolationRecord> ViolationRecords { get; set; } = new List<ViolationRecord>();
}
