namespace StudyHub.Backend.Api.Dtos.QADTOS
{
    public class FileConversationRequest
    {
        public Guid ConversationId { get; set; }
        public IFormFile File { get; set; }

    }
}
