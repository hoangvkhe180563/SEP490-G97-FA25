using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IQAConversationFileRepository
    {
        QAConversationFile? Create(QAConversationFile file);

        QAConversationFile? GetById(Guid id);

        List<QAConversationFile> GetByConversationId(Guid conversationId);
    }
}
