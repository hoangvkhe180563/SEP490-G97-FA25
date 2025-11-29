using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;

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
            try
            {
                var p = _context.Progresses.FirstOrDefault(x => x.Id == id);
                if (p == null) return null;
                return new CourseProgress { Id = p.Id, EnrollmentId = p.EnrollmentId, LessonId = p.LessonId, CompletionDate = p.CompletionDate };
                }
            catch (Exception ex)
            {
                new InfrastructureException("ProgressRepository", "GetProgress failed. Inner error: " + ex.Message).LogError();
                return new CourseProgress { };
            }
        }

        public CourseProgress? GetProgressByEnrollmentAndLesson(int enrollmentId, int lessonId)
        {
            try
            {
                var p = _context.Progresses.FirstOrDefault(x => x.EnrollmentId == enrollmentId && x.LessonId == lessonId);
                if (p == null) return null;
                return new CourseProgress { Id = p.Id, EnrollmentId = p.EnrollmentId, LessonId = p.LessonId, CompletionDate = p.CompletionDate };
            }
            catch (Exception ex)
            {
                new InfrastructureException("ProgressRepository", "GetProgressByEnrollmentAndLesson failed. Inner error: " + ex.Message).LogError();
                return new CourseProgress { };
            }
        }

        public CourseProgress CreateProgress(CourseProgress p)
        {
            try
            {
                var entity = new Data.Progress { EnrollmentId = p.EnrollmentId, LessonId = p.LessonId, CompletionDate = p.CompletionDate == default ? DateTime.Now : p.CompletionDate };
                _context.Progresses.Add(entity);
                _context.SaveChanges();
                p.Id = entity.Id;
                return p;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ProgressRepository", "CreateProgress failed. Inner error: " + ex.Message).LogError();
                return new CourseProgress { };
            }
        }

        public CourseProgress UpdateProgress(CourseProgress p)
        {
            try
            {
                var entity = _context.Progresses.FirstOrDefault(x => x.Id == p.Id);
                if (entity == null) return p;
                entity.EnrollmentId = p.EnrollmentId;
                entity.LessonId = p.LessonId;
                entity.CompletionDate = p.CompletionDate;
                _context.SaveChanges();
                return p;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ProgressRepository", "UpdateProgress failed. Inner error: " + ex.Message).LogError();
                return new CourseProgress { };
            }
        }

        public bool DeleteProgress(int id)
        {
            try
            {
                var entity = _context.Progresses.FirstOrDefault(x => x.Id == id);
                if (entity == null) return false;
                _context.Progresses.Remove(entity);
                _context.SaveChanges();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("ProgressRepository", "DeleteProgress failed. Inner error: " + ex.Message).LogError();
                return false;
            }
        }

        public List<CourseProgress> GetProgressesByEnrollment(int enrollmentId)
        {
            try
            {
                return _context.Progresses.Where(x => x.EnrollmentId == enrollmentId).Select(x => new CourseProgress { Id = x.Id, EnrollmentId = x.EnrollmentId, LessonId = x.LessonId, CompletionDate = x.CompletionDate }).ToList();

            }
            catch (Exception ex)
            {
                new InfrastructureException("ProgressRepository", "GetProgressesByEnrollment failed. Inner error: " + ex.Message).LogError();
                return new List<CourseProgress>();
            }
        }
    }
}
