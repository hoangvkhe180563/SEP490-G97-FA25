namespace StudyHub.Backend.Api.Dtos.QADTOS
{
    public class UpdateQAMessageRequest
    {
        public Guid? ConversationId { get; set; }
        public Guid? SenderId { get; set; }
        public string? Content { get; set; } = null!;
        public bool? IsFromAi { get; set; }
        public bool? IsPaid { get; set; }
    }
}
