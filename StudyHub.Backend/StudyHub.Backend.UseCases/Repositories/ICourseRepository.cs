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
        StudyHub.Backend.UseCases.Models.PagedResult<Course> SearchCourses(StudyHub.Backend.UseCases.Models.CourseQueryParams query);
    }
}
