using Microsoft.EntityFrameworkCore;
using StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.Infrastructure.Exceptions;
using StudyHub.Backend.UseCases.Repositories.Exam;

namespace StudyHub.Backend.Infrastructure.Repositories.Exam
{
    public class QuestionManagerRepository : IQuestionManagerRepository
    {
        private readonly AppDbContext _context;
        public QuestionManagerRepository(AppDbContext context)
        {
            _context = context;
        }

        public List<Domain.Entities.Subject> GetSubjectsByManagerId(Guid managerId)
        {
            try
            {
                var user = _context.AppUsers.Include(u => u.Roles).Include(u => u.Subjects).FirstOrDefault(u => u.Id == managerId);
                if (user == null) return [];
                var hasAdminRole = user.Roles.Any(r => r.Name == "School Admin");
                if (hasAdminRole)
                {
                    return _context.Subjects.Select(s => new Domain.Entities.Subject
                    {
                        Id = s.Id,
                        Name = s.Name
                    }).ToList();
                }
                else
                {
                    return user.Subjects.Select(s => new Domain.Entities.Subject
                    {
                        Id = s.Id,
                        Name = s.Name
                    }).ToList();
                }
            }
            catch (Exception ex)
            {
                new InfrastructureException("QuestionManagerRepository", "GetSubjectsByManagerId failed. Inner error: " + ex.Message).LogError();
            }
            return [];
        }
    }
}
