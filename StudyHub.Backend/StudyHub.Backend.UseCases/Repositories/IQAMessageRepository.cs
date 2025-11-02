using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Repositories
{
    public interface IQAMessageRepository
    {
        List<QAMessage> GetQAMessages();
        QAMessage? GetQAMessageById(Guid id);
        List<QAMessage> GetQAMessagesByConversationId(Guid conversationId);
        QAMessage? CreateQAMessage(QAMessage message);
        QAMessage? UpdateQAMessage(QAMessage message);
    }
}
 
