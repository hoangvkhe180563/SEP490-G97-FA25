using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class Progress
{
    public int Id { get; set; }

    public int EnrollmentId { get; set; }

    public int LessonId { get; set; }

    public DateTime CompletionDate { get; set; }

    public virtual Enrollment Enrollment { get; set; } = null!;

    public virtual Lesson Lesson { get; set; } = null!;
}
