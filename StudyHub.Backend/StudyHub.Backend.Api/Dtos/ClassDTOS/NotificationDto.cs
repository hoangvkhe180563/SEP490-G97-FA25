namespace StudyHub.Backend.Api.Dtos.ClassDTOS
{
    public class NotificationDto
    {
        public int Id { get; set; }
        public int ClassId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Guid CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Arthur { get; set;}
        public string Avatar { get; set; }
        public List<FileDto> Files { get; set; } = new();
        public List<CommentDto> Comments { get; set; } = new();
    }
}
    