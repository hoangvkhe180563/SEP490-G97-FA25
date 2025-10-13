using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface ISchoolRepository
    {
        public School GetSchoolInfo(int id);
    }
}
