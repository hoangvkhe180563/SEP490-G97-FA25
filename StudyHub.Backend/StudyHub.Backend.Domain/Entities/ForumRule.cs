namespace StudyHub.Backend.Domain.Entities
{
    public class ForumRule
    {
        public int Id { get; set; }
        public int SchoolId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string RuleType { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public int ViolationScore { get; set; }
        public bool? IsActive { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid? CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }

        public int PatternCount { get; set; }
        public List<RulePattern>? Patterns { get; set; }
    }
}