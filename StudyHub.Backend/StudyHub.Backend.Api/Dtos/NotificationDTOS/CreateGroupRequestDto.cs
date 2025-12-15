namespace StudyHub.Backend.Api.Dtos.NotificationDTOS
{
    public class CreateGroupRequestDto
    {
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public Guid? CreatedBy { get; set; }
    }
}
