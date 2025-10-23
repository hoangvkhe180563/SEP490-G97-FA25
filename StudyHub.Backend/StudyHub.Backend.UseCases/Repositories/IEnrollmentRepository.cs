
using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IEnrollmentRepository
    {
        Enrollment? GetEnrollment(int id);
        Enrollment? GetEnrollmentByUserAndCourse(Guid userId, int courseId);
        Enrollment CreateEnrollment(Enrollment e);
        bool DeleteEnrollment(int id);
        List<Enrollment> GetEnrollmentsByCourse(int courseId);
        List<Enrollment> GetEnrollmentsByUser(Guid userId);
    }
}
