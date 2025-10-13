namespace StudyHub.Backend.Domain.Entities
{
    public class Parent
    {
        public int Id { get; set; }
        public Guid AppUserId { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? StudentRelation { get; set; }
        public AppUser? AppUser { get; set; }
    }
}
