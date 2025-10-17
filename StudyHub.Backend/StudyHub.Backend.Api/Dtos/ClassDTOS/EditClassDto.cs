namespace StudyHub.Backend.Api.Dtos.ClassDTOS
{
    public class EditClassDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public short? SubjectId { get; set; }
        public string? Description { get; set; }
    }
}
