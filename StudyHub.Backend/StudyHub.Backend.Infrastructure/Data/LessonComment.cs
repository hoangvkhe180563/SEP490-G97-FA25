using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class LessonComment
{
    public int Id { get; set; }

    public int LessonId { get; set; }

    public Guid AppUserId { get; set; }

    public string Content { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual AppUser AppUser { get; set; } = null!;

    public virtual Lesson Lesson { get; set; } = null!;
}
