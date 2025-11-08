using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class NotificationSubmission
{
    public int Id { get; set; }

    public int NotificationId { get; set; }

    public Guid AppUserId { get; set; }

    public DateTime FirstSubmissionTime { get; set; }

    public DateTime LatestSubmissionTime { get; set; }

    public decimal? Score { get; set; }

    public DateTime? GradedAt { get; set; }

    public Guid? GradedBy { get; set; }

    public string? Feedback { get; set; }

    public string SubmissionStatus { get; set; } = null!;

    public virtual ClassNotification Notification { get; set; } = null!;

    public virtual ICollection<SubmissionFile> SubmissionFiles { get; set; } = new List<SubmissionFile>();
}
