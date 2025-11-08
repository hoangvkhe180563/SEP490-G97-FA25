using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class Document
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public short SubjectId { get; set; }

    public sbyte Grade { get; set; }

    public sbyte DocumentCategoryId { get; set; }

    public string DocumentUrl { get; set; } = null!;

    public bool? IsApproved { get; set; }

    public string? Description { get; set; }

    public string? Thumbnail { get; set; }

    public int? SchoolId { get; set; }

    public bool IsInClass { get; set; }

    public bool IsFeatured { get; set; }

    public bool? Status { get; set; }

    public bool? IsRequested { get; set; }

    public DateTime CreatedAt { get; set; }

    public Guid CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public Guid? UpdatedBy { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual DocumentCategory DocumentCategory { get; set; } = null!;

    public virtual School? School { get; set; }

    public virtual Subject Subject { get; set; } = null!;

    public virtual ICollection<Class> Classes { get; set; } = new List<Class>();
}
