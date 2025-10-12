using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class Course
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Information { get; set; }

    public string? ImageUrl { get; set; }

    public uint Price { get; set; }

    public sbyte GradeId { get; set; }

    public short SubjectId { get; set; }

    public bool? Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public Guid CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public Guid? UpdatedBy { get; set; }

    public DateTime? DeletedAt { get; set; }

    public bool IsFeatured { get; set; }

    public virtual ICollection<Chapter> Chapters { get; set; } = new List<Chapter>();

    public virtual Grade Grade { get; set; } = null!;

    public virtual Subject Subject { get; set; } = null!;
}
