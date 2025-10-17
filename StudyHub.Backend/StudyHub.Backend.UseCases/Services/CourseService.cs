using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class CourseService
    {
        private readonly ICourseRepository _repo;
        public CourseService(ICourseRepository repo)
        {
            _repo = repo;
        }

        public List<Course> GetCourses()
        {
            return _repo.GetAllCourses();
        }
            
        public Course? GetCourse(int id)
        {
            return _repo.GetCourseById(id);
        }

        public Course CreateCourse(Course course)
        {
            return _repo.CreateCourse(course);
        }

        public Course UpdateCourse(Course course)
        {
            return _repo.UpdateCourse(course);
        }

        public bool DeleteCourse(int id)
        {
            return _repo.DeleteCourse(id);
        }
    }
}
