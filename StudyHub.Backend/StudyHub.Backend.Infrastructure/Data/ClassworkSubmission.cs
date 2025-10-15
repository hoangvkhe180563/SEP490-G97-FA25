using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class ClassworkSubmission
{
    public int Id { get; set; }

    public int ClassworkId { get; set; }

    public Guid AppUserId { get; set; }

    public DateTime FirstSubmissionTime { get; set; }

    public DateTime LatestSubmissionTime { get; set; }

    public virtual AppUser AppUser { get; set; } = null!;

    public virtual Classwork Classwork { get; set; } = null!;

    public virtual ICollection<SubmissionFile> SubmissionFiles { get; set; } = new List<SubmissionFile>();
}
