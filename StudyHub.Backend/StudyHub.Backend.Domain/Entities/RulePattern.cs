namespace StudyHub.Backend.Domain.Entities
{
    public class RulePattern
    {
        public int Id { get; set; }
        public int RuleId { get; set; }
        public string Pattern { get; set; } = string.Empty;
        public bool? IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid? CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }
    }
}