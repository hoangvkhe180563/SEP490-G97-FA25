namespace StudyHub.Backend.Api.Dtos.QADTOS
{
    public class UpdateQAConversationRequest
    {
        public string? Title { get; set; }
        public int? TopicId { get; set; }
        public Guid? TeacherId { get; set; }
        public bool? IsPaid { get; set; }
    }
}
