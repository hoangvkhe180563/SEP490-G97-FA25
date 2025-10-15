using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class LessonVideo
{
    public int LessonId { get; set; }

    public string Url { get; set; } = null!;

    public virtual Lesson Lesson { get; set; } = null!;
}
