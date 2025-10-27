using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class LessonReading
{
    public int LessonId { get; set; }

    public string Content { get; set; } = null!;

    public virtual Lesson Lesson { get; set; } = null!;
}
