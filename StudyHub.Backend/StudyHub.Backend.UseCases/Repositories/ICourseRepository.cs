using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface ICourseRepository
    {
        List<Course> GetAllCourses();
        Course? GetCourseById(int id);
        Course CreateCourse(Course course);
        Course UpdateCourse(Course course);
        bool DeleteCourse(int id);
        List<Course> GetCourseBySchool(int schoolId);
    }
}
