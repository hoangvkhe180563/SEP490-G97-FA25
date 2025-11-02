using StudyHub.Backend.Api.Dtos.QADTOS;
using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.Api.Mappers
{
    public class QAMessageMapper
    {
        public static QAMessageResponse MapToDto(QAMessage m)
        {
            return new QAMessageResponse
            {
                Id = m.Id,
                ConversationId = m.ConversationId,
                ConversationTitle = m.Conversation?.Title ?? string.Empty,
                SenderId = m.Sender.Id,
                SenderName = m.Sender?.Fullname ?? string.Empty,
                SenderUsername = m.Sender?.Username ?? string.Empty,
                SenderEmail = m.Sender?.Email ?? string.Empty,
                SenderAvatar = m.Sender?.Avatar ?? string.Empty,
                Content = m.Content,
                IsFromAi = m.IsFromAi,
                IsPaid = m.IsPaid,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.CreatedAt
            };
        }
    }
}
