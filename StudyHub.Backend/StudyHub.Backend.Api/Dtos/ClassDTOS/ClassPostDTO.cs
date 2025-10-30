namespace StudyHub.Backend.Api.Dtos.ClassDTOS
{
    public class ClassPostDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public short? SubjectId { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }

        public List<NotificationDto> Notifications { get; set; } = new();
    }
}
