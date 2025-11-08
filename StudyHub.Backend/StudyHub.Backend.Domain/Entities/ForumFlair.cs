namespace StudyHub.Backend.Domain.Entities
{
    public class ForumFlair
    {
        public int Id { get; set; }
        public int SchoolId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsProtected { get; set; }
        public bool? Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid? CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }
    }
}