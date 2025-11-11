using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class ExamQuestion
{
    public string QuestionObjectId { get; set; } = null!;

    public int ExamId { get; set; }

    public virtual Exam Exam { get; set; } = null!;
}
