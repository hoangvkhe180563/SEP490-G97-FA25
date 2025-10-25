using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class LessonResource
{
    public int Id { get; set; }

    public string Url { get; set; } = null!;

    public List<Lesson> Lessons { get; set; } = new List<Lesson>();
}
