namespace StudyHub.Backend.Api.Dtos.ClassDTOS
{
    public class CreateNotificationDto
    {
        public int ClassId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Guid CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public IFormFile? Files { get; set; }
    }
}
