namespace StudyHub.Backend.Api.Dtos.ClassDTOS
{
    public class CreateClassDto
    {
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public Guid CreatedBy { get; set; }
    }
}
