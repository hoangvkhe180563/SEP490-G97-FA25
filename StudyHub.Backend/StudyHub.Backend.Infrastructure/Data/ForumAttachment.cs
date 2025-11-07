using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class ForumAttachment
{
    public int Id { get; set; }

    public int? PostId { get; set; }

    public int? CommentId { get; set; }

    public string FileUrl { get; set; } = null!;

    public bool IsApproved { get; set; }

    public DateTime CreatedAt { get; set; }

    public Guid CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public Guid? UpdatedBy { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual ForumComment? Comment { get; set; }

    public virtual AppUser CreatedByNavigation { get; set; } = null!;

    public virtual ForumPost? Post { get; set; }
}
