using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Dtos;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface ICourseRepository
    {
        Course? GetCourseById(int id);
        Course CreateCourse(Course course);
        Course UpdateCourse(Course course);
        bool DeleteCourse(int id);
        List<Course> GetCourseBySchool(int schoolId);
        PagedResult<Course> GetAllCourses(CourseQueryParams query);
    }
}
