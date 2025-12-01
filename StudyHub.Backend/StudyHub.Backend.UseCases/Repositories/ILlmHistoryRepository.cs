using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface ILlmHistoryRepository
    {
        void Create(LlmHistory entry);
        LlmHistory? GetById(int id);
        void UpdateResponse(int id, string response);
        void UpdateTokens(int id, int? inputTokens, int? outputTokens);
        void UpdateStatus(int id, string status);
        void Delete(int id);
        List<LlmHistory> ListByUser(Guid userId);
    }
}
