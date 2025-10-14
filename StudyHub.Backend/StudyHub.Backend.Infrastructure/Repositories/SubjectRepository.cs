using StudyHub.Backend.Domain.Entities;
using Data = StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.Infrastructure.Exceptions;
using System.Linq;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    internal class SubjectRepository : ISubjectRepository
    {
        private readonly Data.AppDbContext _context;
        public SubjectRepository(Data.AppDbContext context)
        {
            _context = context;
        }
        public Subject CreateSubject(Subject subject)
        {
            throw new NotImplementedException();
        }

        public bool DeleteSubject(int id)
        {
            throw new NotImplementedException();
        }

        public List<Subject> GetAllSubjects()
        {
            try
            {
                return _context.Subjects.Select(g => new Domain.Entities.Subject
                {
                    Id = g.Id,
                    Name = g.Name,

                }).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("GradeRepository", "GetAllGrade failed. Inner error: " + ex.Message).LogError();
                return new List<Subject>();
            }
        }

        public Subject? GetSubjectById(int id)
        {
            throw new NotImplementedException();
        }

        public Subject UpdateSubject(Subject subject)
        {
            throw new NotImplementedException();
        }
    }
}
