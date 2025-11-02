using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.UseCases.Repositories;

namespace StudyHub.Backend.UseCases.Services
{
    public class QAMessageService
    {
        public readonly IQAMessageRepository _repo;
        private readonly AuthService authService;

        public QAMessageService(IQAMessageRepository repo, AuthService authService)
        {
            _repo = repo;
            this.authService = authService;
        }

        public List<QAMessage> GetQAMessages()
        {
            return _repo.GetQAMessages();
        }

        public QAMessage? GetQAMessageById(System.Guid id)
        {
            return _repo.GetQAMessageById(id);
        }

        public List<QAMessage> GetQAMessagesByConversationId(System.Guid conversationId)
        {
            return _repo.GetQAMessagesByConversationId(conversationId);
        }

        public QAMessage? CreateQAMessage(Guid convId, string content, bool isFromAi, bool isPaid)
        {
            var current = authService.GetCurrentUser();
            var msg = new QAMessage
            {
                Id = Guid.NewGuid(),
                ConversationId = convId,
                SenderId = current.Id,
                Content = content,
                IsFromAi = isFromAi,
                IsPaid = isPaid,
                CreatedAt = DateTime.Now,
            };

            return _repo.CreateQAMessage(msg);
        }

        public QAMessage? UpdateQAMessage(Guid id, Guid? convId, string? content, bool? isFromAi, bool? isPaid)
        {
            var msg = _repo.GetQAMessageById(id);
            if (msg == null) return null;
            if (convId.HasValue)
            {
                msg.ConversationId = convId.Value;
            }
            if (!string.IsNullOrEmpty(content))
            {
                msg.Content = content;
            }
            if (isFromAi.HasValue)
            {
                msg.IsFromAi = isFromAi.Value;
            }
            if (isPaid.HasValue)
            {
                msg.IsPaid = isPaid.Value;
            }
            return _repo.UpdateQAMessage(msg);
        }
    }
}
