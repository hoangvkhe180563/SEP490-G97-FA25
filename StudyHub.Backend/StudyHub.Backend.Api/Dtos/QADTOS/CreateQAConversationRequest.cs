namespace StudyHub.Backend.Api.Dtos.QADTOS
{
    public class CreateQAConversationRequest
    {
        public string Title { get; set; } = null!;
        public int TopicId { get; set; }
        public Guid? TeacherId { get; set; }
        public bool IsPaid { get; set; }

    }
}
