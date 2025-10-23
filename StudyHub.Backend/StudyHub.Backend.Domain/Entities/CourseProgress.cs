namespace StudyHub.Backend.Domain.Entities;

public class CourseProgress
{
    public int Id { get; set; }
    public int EnrollmentId { get; set; }
    public int LessonId { get; set; }
    public DateTime CompletionDate { get; set; }
}
