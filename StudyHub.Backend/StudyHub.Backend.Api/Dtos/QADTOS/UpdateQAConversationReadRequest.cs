using System;

namespace StudyHub.Backend.Api.Dtos.QADTOS
{
    public class UpdateQAConversationReadRequest
    {
        public Guid ConversationId { get; set; }
        public Guid UserId { get; set; }
    }
}
