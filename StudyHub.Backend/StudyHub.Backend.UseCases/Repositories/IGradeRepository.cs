using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IGradeRepository
    {
        List<Grade> GetAllGrade();
        Grade? GetByGradeId(int id);
        Grade CreateGrade(Grade grade);
        Grade UpdateGrade(Grade grade);
        bool DeleteGrade(int id);
    }
}
