using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class School
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string Address { get; set; } = null!;

    public int CommuneId { get; set; }

    public virtual Commune Commune { get; set; } = null!;

    public virtual ICollection<Document> Documents { get; set; } = new List<Document>();

    public virtual ICollection<ForumAppeal> ForumAppeals { get; set; } = new List<ForumAppeal>();

    public virtual ICollection<ForumFlair> ForumFlairs { get; set; } = new List<ForumFlair>();

    public virtual ICollection<ForumPost> ForumPosts { get; set; } = new List<ForumPost>();

    public virtual ICollection<ForumRule> ForumRules { get; set; } = new List<ForumRule>();

    public virtual LandingPage? LandingPage { get; set; }

    public virtual PaymentInfo? PaymentInfo { get; set; }

    public virtual ICollection<UserForumStatus> UserForumStatuses { get; set; } = new List<UserForumStatus>();

    public virtual ICollection<ViolationRecord> ViolationRecords { get; set; } = new List<ViolationRecord>();
}
