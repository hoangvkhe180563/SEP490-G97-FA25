using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class ForumFlair
{
    public int Id { get; set; }

    public int SchoolId { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public bool IsProtected { get; set; }

    public bool? Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public Guid CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public Guid? UpdatedBy { get; set; }

    public virtual AppUser CreatedByNavigation { get; set; } = null!;

    public virtual ICollection<ForumPost> ForumPosts { get; set; } = new List<ForumPost>();

    public virtual School School { get; set; } = null!;
}
