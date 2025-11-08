using System;
using System.Collections.Generic;
using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IQAConversationReadRepository
    {
        List<QAConversationRead> GetReadsByConversationId(Guid conversationId);
        List<QAConversationRead> GetReadsByUserId(Guid userId);
        QAConversationRead? GetReadByUserAndConversation(Guid userId, Guid conversationId);
        int CountReadByUserAndConversation(Guid userId, Guid conversationId);
        QAConversationRead? UpsertRead(QAConversationRead read);
        int CountUnreadMessagesForUser(Guid conversationId, Guid userId);
    }
}
