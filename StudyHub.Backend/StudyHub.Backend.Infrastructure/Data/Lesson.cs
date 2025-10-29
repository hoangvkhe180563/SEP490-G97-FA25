using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class Lesson
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public int ChapterId { get; set; }

    public string Type { get; set; } = null!;

    public string? Duration { get; set; }

    public string? Description { get; set; }

    public DateTime? PostDate { get; set; }

    public bool? IsPreview { get; set; }

    public int? ResourceId { get; set; }

    public virtual Chapter Chapter { get; set; } = null!;

    public virtual ICollection<LessonComment> LessonComments { get; set; } = new List<LessonComment>();

    public virtual LessonReading? LessonReading { get; set; }

    public virtual LessonVideo? LessonVideo { get; set; }

    public virtual ICollection<Progress> Progresses { get; set; } = new List<Progress>();

    public virtual LessonResource? Resource { get; set; }
}
