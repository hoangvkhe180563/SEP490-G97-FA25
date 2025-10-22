using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class EnrollmentService
    {
        private readonly IEnrollmentRepository _repo;
        public EnrollmentService(IEnrollmentRepository repo)
        {
            _repo = repo;
        }

        public Enrollment? GetEnrollment(int id) => _repo.GetEnrollment(id);
        public Enrollment? GetEnrollmentByUserAndCourse(Guid userId, int courseId) => _repo.GetEnrollmentByUserAndCourse(userId, courseId);
        public Enrollment CreateEnrollment(Enrollment e) => _repo.CreateEnrollment(e);
        public bool DeleteEnrollment(int id) => _repo.DeleteEnrollment(id);
        public List<Enrollment> GetEnrollmentsByCourse(int courseId) => _repo.GetEnrollmentsByCourse(courseId);
        public List<Enrollment> GetEnrollmentsByUser(Guid userId) => _repo.GetEnrollmentsByUser(userId);
    }
}
