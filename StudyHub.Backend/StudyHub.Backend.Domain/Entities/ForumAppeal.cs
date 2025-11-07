
namespace StudyHub.Backend.Domain.Entities
{
    public class ForumAppeal
    {
        public int Id { get; set; }
        public Guid UserId { get; set; }
        public int SchoolId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public bool? Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }

        public AppUser? User { get; set; }
    }
}
