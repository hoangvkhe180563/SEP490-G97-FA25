using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class Lesson
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public bool IsPreview { get; set; }

    public int ChapterId { get; set; }

    public bool? Status { get; set; }

    public string Type { get; set; } = null!;

    public string Content { get; set; } = null!;

    public virtual Chapter Chapter { get; set; } = null!;
}
