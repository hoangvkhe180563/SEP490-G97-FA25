using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface ILlmHistoryRepository
    {
        void Create(LlmHistory entry);
        LlmHistory? GetById(int id);
        void UpdateResponse(int id, string response);
        List<LlmHistory> ListByUser(Guid userId);
    }
}
