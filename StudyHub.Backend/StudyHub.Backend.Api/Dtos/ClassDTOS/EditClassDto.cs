namespace StudyHub.Backend.Api.Dtos.ClassDTOS
{
    public class EditClassDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public sbyte Grade { get; set; }
        public Guid? UpdatedBy { get; set; }
    }
}
