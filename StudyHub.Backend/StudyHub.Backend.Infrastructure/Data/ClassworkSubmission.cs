using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class ClassworkSubmission
{
    public int Id { get; set; }

    public int ClassworkId { get; set; }

    public int StudentId { get; set; }

    public DateTime FirstSubmissionTime { get; set; }

    public DateTime LatestSubmissionTime { get; set; }

    public bool? Status { get; set; }

    public virtual Classwork Classwork { get; set; } = null!;

    public virtual Student Student { get; set; } = null!;

    public virtual ICollection<SubmissionFile> SubmissionFiles { get; set; } = new List<SubmissionFile>();
}
