using StudyHub.Backend.Domain.Entities;

public class ViolationRecord
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public int SchoolId { get; set; }
    public int? PostId { get; set; }
    public int? CommentId { get; set; }
    public int? MatchedRuleId { get; set; }
    public int? MatchedPatternId { get; set; }
    public int ViolationScore { get; set; }
    public string SourceType { get; set; } = "auto";
    public Guid? ReportedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
    public AppUser? User { get; set; }
    public ForumPost? Post { get; set; }
    public ForumComment? Comment { get; set; }
    public ForumRule? Rule { get; set; }
    public RulePattern? Pattern { get; set; }
    public AppUser? Reporter { get; set; }
}