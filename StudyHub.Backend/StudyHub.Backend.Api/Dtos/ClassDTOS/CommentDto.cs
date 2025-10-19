namespace StudyHub.Backend.Api.Dtos.ClassDTOS
{
    public class CommentDto
    {
        public int Id { get; set; }
        public int NotificationId { get; set; }
        public Guid UserId { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string UserFullname { get; set; } = string.Empty;
    }
}
