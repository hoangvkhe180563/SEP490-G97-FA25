using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IProgressRepository
    {
        CourseProgress? GetProgress(int id);
        CourseProgress? GetProgressByEnrollmentAndLesson(int enrollmentId, int lessonId);
        CourseProgress CreateProgress(CourseProgress p);
        CourseProgress UpdateProgress(CourseProgress p);
        bool DeleteProgress(int id);
        List<CourseProgress> GetProgressesByEnrollment(int enrollmentId);
    }
}
