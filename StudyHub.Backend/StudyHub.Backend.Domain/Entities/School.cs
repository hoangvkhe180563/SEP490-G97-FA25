namespace StudyHub.Backend.Domain.Entities
{
    public class School
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Address { get; set; }
        public int? CommuneId { get; set; }
    }
}
