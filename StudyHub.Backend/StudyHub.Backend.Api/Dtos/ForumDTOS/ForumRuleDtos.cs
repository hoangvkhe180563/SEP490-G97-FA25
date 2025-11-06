using System.ComponentModel.DataAnnotations;

namespace StudyHub.Backend.Api.Dtos.ForumDTOs
{
    public class ForumRuleListDto
    {
        public int RuleId { get; set; }
        public int SchoolId { get; set; }
        public string? SchoolName { get; set; }
        public string RuleName { get; set; } = string.Empty;
        public string RuleType { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public int ViolationScore { get; set; }
        public bool IsActive { get; set; }
        public string? Description { get; set; }
        public int PatternCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid CreatedBy { get; set; }
        public string? CreatorName { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }
    }

    public class ForumRuleDetailDto
    {
        public int RuleId { get; set; }
        public int SchoolId { get; set; }
        public string? SchoolName { get; set; }
        public string RuleName { get; set; } = string.Empty;
        public string RuleType { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public int ViolationScore { get; set; }
        public bool IsActive { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid CreatedBy { get; set; }
        public string? CreatorName { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }
        public List<RulePatternDto> Patterns { get; set; } = new();
    }

    public class CreateForumRuleDto
    {
        [Required(ErrorMessage = "Trường học là bắt buộc")]
        public int SchoolId { get; set; }

        [Required(ErrorMessage = "Tên rule là bắt buộc")]
        [StringLength(200)]
        public string RuleName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Loại rule là bắt buộc")]
        [StringLength(100)]
        public string RuleType { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mức độ nghiêm trọng là bắt buộc")]
        [StringLength(50)]
        public string Severity { get; set; } = string.Empty; 

        [Required(ErrorMessage = "Điểm vi phạm là bắt buộc")]
        [Range(1, 50, ErrorMessage = "Điểm vi phạm từ 1-50")]
        public int ViolationScore { get; set; }

        [StringLength(1000)]
        public string? Description { get; set; }

        public List<string> Patterns { get; set; } = new();
    }

    public class UpdateForumRuleDto
    {
        [Required]
        public int RuleId { get; set; }

        [Required]
        [StringLength(200)]
        public string RuleName { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string RuleType { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Severity { get; set; } = string.Empty;

        [Required]
        [Range(1, 50)]
        public int ViolationScore { get; set; }

        [StringLength(1000)]
        public string? Description { get; set; }
    }

    public class ForumRuleFilterDto
    {
        public int SchoolId { get; set; }
        public string? RuleType { get; set; }
        public string? Severity { get; set; }
        public bool? IsActive { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class ToggleRuleStatusDto
    {
        [Required]
        public int RuleId { get; set; }

        [Required]
        public bool IsActive { get; set; }
    }
}