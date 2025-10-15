using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;
namespace StudyHub.Backend.UseCases.Services
{
    public class GradeService
    {
        public readonly IGradeRepository _gradeRepo;
        public GradeService(IGradeRepository gradeRepo)
        {
            _gradeRepo = gradeRepo;
        }
        public List<Grade> GetAllGrades()
        {
            return _gradeRepo.GetAllGrade();
        }
        public Grade? GetGradeById(int id)
        {
            return _gradeRepo.GetByGradeId(id);
        }
    }
}
