using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories;
using Data = StudyHub.Backend.Infrastructure.Data;

namespace Infrastructure.Repositories
{
    public class EnrollmentRepository : IEnrollmentRepository
    {
        private readonly Data.AppDbContext _context;

        public EnrollmentRepository(Data.AppDbContext context)
        {
            _context = context;
        }

        public Enrollment? GetEnrollment(int id)
        {
            try { 
                var e = _context.Enrollments.FirstOrDefault(x => x.Id == id);
                if (e == null) return null;
                return new Enrollment
                {
                    Id = e.Id,
                    AppUserId = e.AppUserId,
                    CourseId = e.CourseId,
                    EnrollmentDate = e.EnrollmentDate
                };
            }
            catch (Exception ex)
            {
                new InfrastructureException("EnrollmentRepository", "GetAllEnrollments failed. Inner error: " + ex.Message).LogError();
                return new Enrollment{};
            }
        }

        public Enrollment? GetEnrollmentByUserAndCourse(Guid userId, int courseId)
        {
            try
            {
                var e = _context.Enrollments.FirstOrDefault(x => x.AppUserId == userId && x.CourseId == courseId);
                if (e == null) return null;
                return new Enrollment
                {
                    Id = e.Id,
                    AppUserId = e.AppUserId,
                    CourseId = e.CourseId,
                    EnrollmentDate = e.EnrollmentDate
                };
            }
            catch (Exception ex)
            {
                new InfrastructureException("EnrollmentRepository", "GetAllEnrollments failed. Inner error: " + ex.Message).LogError();
                return new Enrollment { };
            }
        }

        public Enrollment CreateEnrollment(Enrollment en)
        {
            try
            {
                var entity = new Data.Enrollment
                {
                    AppUserId = en.AppUserId,
                    CourseId = en.CourseId,
                    EnrollmentDate = en.EnrollmentDate == default ? DateTime.UtcNow : en.EnrollmentDate
                };
                _context.Enrollments.Add(entity);
                _context.SaveChanges();
                en.Id = entity.Id;
                return en;
            }
            catch (Exception ex)
            {
                new InfrastructureException("EnrollmentRepository", "GetAllEnrollments failed. Inner error: " + ex.Message).LogError();
                return new Enrollment { };
            }
        }

        public bool DeleteEnrollment(int id)
        {
            try
            {
                var e = _context.Enrollments.FirstOrDefault(x => x.Id == id);
                if (e == null) return false;
                _context.Enrollments.Remove(e);
                _context.SaveChanges();
                return true;
            }
            catch (Exception ex)
            {
                new InfrastructureException("EnrollmentRepository", "GetAllEnrollments failed. Inner error: " + ex.Message).LogError();
                return false;
            }
        }

        public List<Enrollment> GetEnrollmentsByCourse(int courseId)
        {
            try
            {
                return _context.Enrollments
                .Where(x => x.CourseId == courseId)
                .Select(x => new Enrollment { Id = x.Id, AppUserId = x.AppUserId, CourseId = x.CourseId, EnrollmentDate = x.EnrollmentDate })
                .ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("EnrollmentRepository", "GetAllEnrollments failed. Inner error: " + ex.Message).LogError();
                return new List<Enrollment>();
            }
        }

        public List<Enrollment> GetEnrollmentsByUser(Guid userId)
        {
            try
            {
                return _context.Enrollments
                .Where(x => x.AppUserId == userId)
                .Select(x => new Enrollment { Id = x.Id, AppUserId = x.AppUserId, CourseId = x.CourseId, EnrollmentDate = x.EnrollmentDate })
                .ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("EnrollmentRepository", "GetAllEnrollments failed. Inner error: " + ex.Message).LogError();
                return new List<Enrollment>();
            }
        }
    }
}
