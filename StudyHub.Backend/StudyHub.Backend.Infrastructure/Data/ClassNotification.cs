using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class ClassNotification
{
    public int Id { get; set; }

    public int ClassId { get; set; }

    public string Type { get; set; } = null!;

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public Guid CreatedBy { get; set; }

    public DateTime? Deadline { get; set; }

    public decimal? MaxScore { get; set; }

    public string? GradeType { get; set; }

    public bool AllowSubmission { get; set; }

    public string? InstructionsHtml { get; set; }

    public virtual Class Class { get; set; } = null!;

    public virtual ICollection<ClassNotificationComment> ClassNotificationComments { get; set; } = new List<ClassNotificationComment>();

    public virtual ICollection<ClassNotificationFile> ClassNotificationFiles { get; set; } = new List<ClassNotificationFile>();

    public virtual ICollection<NotificationSubmission> NotificationSubmissions { get; set; } = new List<NotificationSubmission>();
}
