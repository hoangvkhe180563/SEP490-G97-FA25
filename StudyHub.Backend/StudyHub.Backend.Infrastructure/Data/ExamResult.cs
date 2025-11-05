using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class ExamResult
{
    public string ResultObjectId { get; set; } = null!;

    public int ExamId { get; set; }

    public Guid StudentId { get; set; }

    public int CheatTimes { get; set; }

    public DateTime FinishTime { get; set; }

    public DateTime? SubmissionTime { get; set; }

    public decimal Score { get; set; }

    public virtual Exam Exam { get; set; } = null!;

    public virtual AppUser Student { get; set; } = null!;
}
