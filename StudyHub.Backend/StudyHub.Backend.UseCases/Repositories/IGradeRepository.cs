using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IGradeRepository
    {
        Task<Grade> GetByIdAsync(Guid id);
        Task<IEnumerable<Grade>> GetAllAsync();
        Task AddAsync(Grade grade);
        Task UpdateAsync(Grade grade);
        Task DeleteAsync(Guid id);
    }
}
