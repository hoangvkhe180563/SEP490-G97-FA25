using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class Classwork
{
    public int Id { get; set; }

    public int ClassId { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public DateTime? Deadline { get; set; }

    public DateTime CreatedAt { get; set; }

    public Guid CreatedBy { get; set; }

    public virtual Class Class { get; set; } = null!;

    public virtual ICollection<ClassworkSubmission> ClassworkSubmissions { get; set; } = new List<ClassworkSubmission>();
}
