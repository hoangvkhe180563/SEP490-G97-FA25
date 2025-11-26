using System.ComponentModel.DataAnnotations;

namespace StudyHub.Backend.Api.Dtos.ForumDTOs
{
    public class ViolationRecordListDto
    {
        public int RecordId { get; set; }
        public Guid UserId { get; set; }
        public string? Username { get; set; }
        public string? Fullname { get; set; }
        public int SchoolId { get; set; }
        public string? SchoolName { get; set; }
        public int? PostId { get; set; }
        public string? PostTitle { get; set; }
        public int? CommentId { get; set; }
        public int? MatchedRuleId { get; set; }
        public string? RuleName { get; set; }
        public int? MatchedPatternId { get; set; }
        public string? PatternText { get; set; }
        public int ViolationScore { get; set; }
        public string SourceType { get; set; } = string.Empty;
        public Guid? ReportedBy { get; set; }
        public string? ReporterName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? DeletedAt { get; set; }
    }

    public class ViolationRecordDto
    {
        public int RecordId { get; set; }
        public Guid UserId { get; set; }
        public string? Username { get; set; }
        public string? Fullname { get; set; }
        public int SchoolId { get; set; }
        public string? SchoolName { get; set; }
        public int? PostId { get; set; }
        public string? PostTitle { get; set; }
        public string? PostContent { get; set; }
        public int? CommentId { get; set; }
        public string? CommentContent { get; set; }
        public int? MatchedRuleId { get; set; }
        public string? RuleName { get; set; }
        public string? RuleSeverity { get; set; }
        public string? RuleDescription { get; set; }
        public int? MatchedPatternId { get; set; }
        public string? PatternText { get; set; }
        public int ViolationScore { get; set; }
        public string SourceType { get; set; } = string.Empty;
        public Guid? ReportedBy { get; set; }
        public string? ReporterName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? DeletedAt { get; set; }
    }

    public class CreateViolationRecordDto
    {
        [Required]
        public Guid UserId { get; set; }

        [Required]
        public int SchoolId { get; set; }

        public int? PostId { get; set; }
        public int? CommentId { get; set; }

        public int? MatchedRuleId { get; set; }
        public int? MatchedPatternId { get; set; }

        [Required]
        [Range(1, 50)]
        public int ViolationScore { get; set; }

        [Required]
        [StringLength(20)]
        public string SourceType { get; set; } = "manual"; 

        public Guid? ReportedBy { get; set; }

        [StringLength(1000)]
        public string? Reason { get; set; }
    }

    public class ViolationRecordFilterDto
    {
        public int SchoolId { get; set; }
        public Guid? UserId { get; set; }
        public int? PostId { get; set; }
        public int? CommentId { get; set; }
        public string? SourceType { get; set; } 
        public int? RuleId { get; set; }
        public string? Qerry { get; set; }
        public int? MinViolationScore { get; set; }
        public int? MaxViolationScore { get; set; }
        public string? RuleSeverity { get; set; }
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
        public bool IncludeDeleted { get; set; } = false;
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class DeleteViolationRecordDto
    {
        [Required]
        public int RecordId { get; set; }

        [StringLength(500)]
        public string? Reason { get; set; }
    }
    public class ApproveViolationReportDto
    {
        [Required]
        public int RecordId { get; set; }

        [StringLength(500)]
        public string? Note { get; set; }
    }

    public class RejectViolationReportDto
    {
        [Required]
        public int RecordId { get; set; }

        [Required]
        [StringLength(500, MinimumLength = 10)]
        public string Reason { get; set; } = string.Empty;
    }
    public class BulkDeleteViolationRecordsDto
    {
        [Required]
        [MinLength(1)]
        public List<int> RecordIds { get; set; } = new();

        [StringLength(500)]
        public string? Reason { get; set; }
    }
    public class HideContentDto
    {
        public int ViolationScore { get; set; }
    }
    public class ReportContentDto
    {
        public int RuleId { get; set; }
        public string? Reason { get; set; }
    }
}