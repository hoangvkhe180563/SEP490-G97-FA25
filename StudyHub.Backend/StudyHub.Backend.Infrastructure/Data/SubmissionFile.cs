using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class SubmissionFile
{
    public int Id { get; set; }

    public int SubmissionId { get; set; }

    public string FileName { get; set; } = null!;

    public string FileUrl { get; set; } = null!;

    public virtual NotificationSubmission Submission { get; set; } = null!;
}
