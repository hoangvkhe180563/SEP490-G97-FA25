using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class Class
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public short? SubjectId { get; set; }

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }

    public Guid CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public Guid? UpdatedBy { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual ICollection<AppClaim> AppClaims { get; set; } = new List<AppClaim>();

    public virtual ICollection<ClassMember> ClassMembers { get; set; } = new List<ClassMember>();

    public virtual ICollection<ClassNotification> ClassNotifications { get; set; } = new List<ClassNotification>();

    public virtual ICollection<Classwork> Classworks { get; set; } = new List<Classwork>();

    public virtual Subject? Subject { get; set; }
}
