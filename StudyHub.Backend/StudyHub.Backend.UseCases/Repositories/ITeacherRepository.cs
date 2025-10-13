using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface ITeacherRepository
    {
        List<Teacher> GetFeaturedTeachersBySchool(int schoolId);
    }
}
