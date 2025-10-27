namespace StudyHub.Backend.Api.Dtos.ClassworkDTOS
{
    public class EditClassworkDto
    {
        public string Title { get; set; } = "";
        public string? Description { get; set; }
        public DateTime? Deadline { get; set; }
    }
}
