namespace StudyHub.Backend.Domain.Entities
{
    public class Subject
    {
        public short Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
