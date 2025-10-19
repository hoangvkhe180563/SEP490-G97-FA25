using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.UseCases.Repositories;
using System.Linq;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    public class ProgressRepository : IProgressRepository
    {
        private readonly AppDbContext _context;
        public ProgressRepository(AppDbContext context)
        {
            _context = context;
        }

        public CourseProgress? GetProgress(int id)
        {
            var p = _context.Progresses.FirstOrDefault(x => x.Id == id);
            if (p == null) return null;
            return new CourseProgress { Id = p.Id, EnrollmentId = p.EnrollmentId, LessonId = p.LessonId, CompletionDate = p.CompletionDate };
        }

        public CourseProgress? GetProgressByEnrollmentAndLesson(int enrollmentId, int lessonId)
        {
            var p = _context.Progresses.FirstOrDefault(x => x.EnrollmentId == enrollmentId && x.LessonId == lessonId);
            if (p == null) return null;
            return new CourseProgress { Id = p.Id, EnrollmentId = p.EnrollmentId, LessonId = p.LessonId, CompletionDate = p.CompletionDate };
        }

        public CourseProgress CreateProgress(CourseProgress p)
        {
            var entity = new Data.Progress { EnrollmentId = p.EnrollmentId, LessonId = p.LessonId, CompletionDate = p.CompletionDate == default ? DateTime.UtcNow : p.CompletionDate };
            _context.Progresses.Add(entity);
            _context.SaveChanges();
            p.Id = entity.Id;
            return p;
        }

        public CourseProgress UpdateProgress(CourseProgress p)
        {
            var entity = _context.Progresses.FirstOrDefault(x => x.Id == p.Id);
            if (entity == null) return p;
            entity.EnrollmentId = p.EnrollmentId;
            entity.LessonId = p.LessonId;
            entity.CompletionDate = p.CompletionDate;
            _context.SaveChanges();
            return p;
        }

        public bool DeleteProgress(int id)
        {
            var entity = _context.Progresses.FirstOrDefault(x => x.Id == id);
            if (entity == null) return false;
            _context.Progresses.Remove(entity);
            _context.SaveChanges();
            return true;
        }

        public List<CourseProgress> GetProgressesByEnrollment(int enrollmentId)
        {
            return _context.Progresses.Where(x => x.EnrollmentId == enrollmentId).Select(x => new CourseProgress { Id = x.Id, EnrollmentId = x.EnrollmentId, LessonId = x.LessonId, CompletionDate = x.CompletionDate }).ToList();
        }
    }
}
