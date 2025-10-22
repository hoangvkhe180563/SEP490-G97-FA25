namespace StudyHub.Backend.Domain.Entities;

public class Enrollment
{
    public int Id { get; set; }
    public Guid AppUserId { get; set; }
    public int CourseId { get; set; }
    public DateTime EnrollmentDate { get; set; }
    public List<CourseProgress> Progresses { get; set; } = new();
}
