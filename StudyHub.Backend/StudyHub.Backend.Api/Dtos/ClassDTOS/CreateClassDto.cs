namespace StudyHub.Backend.Api.Dtos.ClassDTOS
{
    public class CreateClassDto
    {
        public string Name { get; set; } = null!;
        public short? SubjectId { get; set; }
        public string? Description { get; set; }
        public string CreatedBy { get; set; } = null!;
    }
}
