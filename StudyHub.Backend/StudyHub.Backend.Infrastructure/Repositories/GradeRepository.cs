using StudyHub.Backend.Domain.Entities;
using Data = StudyHub.Backend.Infrastructure.Data;
using StudyHub.Backend.UseCases.Repositories;
using StudyHub.Backend.Infrastructure.Exceptions;
using System.Linq;

namespace StudyHub.Backend.Infrastructure.Repositories
{
    internal class GradeRepository : IGradeRepository
    {
        private readonly Data.AppDbContext _context;
        public GradeRepository(Data.AppDbContext context)
        {
            _context = context;
        }
        public Grade CreateGrade(Grade grade)
        {
            throw new NotImplementedException();
        }

        public bool DeleteGrade(int id)
        {
            throw new NotImplementedException();
        }

        public List<Grade> GetAllGrade()
        {
            try 
            {
                return _context.Grades.Select(g => new Domain.Entities.Grade
                {
                    Id = g.Id,
                    Name = g.Name,
                   
                }).ToList();
            }
            catch (Exception ex)
            {
                new InfrastructureException("GradeRepository", "GetAllGrade failed. Inner error: " + ex.Message).LogError();
                return new List<Grade>();
            }
        }

        public Grade? GetByGradeId(int id)
        {
            throw new NotImplementedException();
        }

        public Grade UpdateGrade(Grade grade)
        {
            throw new NotImplementedException();
        }
    }
}
