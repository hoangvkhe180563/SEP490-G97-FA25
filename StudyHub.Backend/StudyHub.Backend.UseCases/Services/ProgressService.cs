using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class ProgressService
    {
        private readonly IProgressRepository _repo;
        public ProgressService(IProgressRepository repo)
        {
            _repo = repo;
        }

        public CourseProgress? GetProgress(int id) => _repo.GetProgress(id);
        public CourseProgress? GetProgressByEnrollmentAndLesson(int enrollmentId, int lessonId) => _repo.GetProgressByEnrollmentAndLesson(enrollmentId, lessonId);
        public CourseProgress CreateProgress(CourseProgress p) => _repo.CreateProgress(p);
        public CourseProgress UpdateProgress(CourseProgress p) => _repo.UpdateProgress(p);
        public bool DeleteProgress(int id) => _repo.DeleteProgress(id);
        public List<CourseProgress> GetProgressesByEnrollment(int enrollmentId) => _repo.GetProgressesByEnrollment(enrollmentId);
    }
}
