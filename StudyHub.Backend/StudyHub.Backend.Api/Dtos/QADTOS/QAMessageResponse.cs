namespace StudyHub.Backend.Api.Dtos.QADTOS
{
    public class QAMessageResponse
    {
        public Guid Id { get; set; }
        public Guid ConversationId { get; set; }
        public string ConversationTitle { get; set; } = null!;
        public Guid SenderId { get; set; }
        public string SenderName { get; set; } = null!;
        public string SenderUsername { get; set; } = null!;
        public string SenderEmail { get; set; } = null!;
        public string SenderAvatar { get; set; } = null!;
        public string Content { get; set; } = null!;
        public bool IsFromAi { get; set; }
        public bool IsPaid { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
