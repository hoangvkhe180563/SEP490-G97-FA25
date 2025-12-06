namespace StudyHub.Backend.Api.Dtos
{
    public class CreateCommentDto
    {
        public string Content { get; set; } = string.Empty;
        public Guid CreatedBy { get; set; }
    }
}
