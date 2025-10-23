using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;

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
        PagedResult<Course> SearchCourses(CourseQueryParams query);
    }
}
