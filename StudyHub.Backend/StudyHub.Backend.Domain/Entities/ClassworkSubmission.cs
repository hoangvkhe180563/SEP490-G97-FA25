namespace StudyHub.Backend.Domain.Entities;

public class ClassworkSubmission
{
    public int Id { get; set; }

    public int ClassworkId { get; set; }

    public Guid AppUserId { get; set; }

    public DateTime FirstSubmissionTime { get; set; }

    public DateTime LatestSubmissionTime { get; set; }
}
