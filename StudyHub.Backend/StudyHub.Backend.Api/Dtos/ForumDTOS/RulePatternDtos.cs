using System.ComponentModel.DataAnnotations;

namespace StudyHub.Backend.Api.Dtos.ForumDTOs
{
    public class RulePatternDto
    {
        public int PatternId { get; set; }
        public int RuleId { get; set; }
        public string Pattern { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid CreatedBy { get; set; }
        public string? CreatorName { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }
    }

    public class CreateRulePatternDto
    {
        [Required]
        public int RuleId { get; set; }

        [Required(ErrorMessage = "Pattern là bắt buộc")]
        [StringLength(500)]
        public string Pattern { get; set; } = string.Empty;
    }

    public class CreateMultipleRulePatternsDto
    {
        [Required]
        public int RuleId { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "Phải có ít nhất 1 pattern")]
        public List<string> Patterns { get; set; } = new();
    }

    public class UpdateRulePatternDto
    {
        [Required]
        public int PatternId { get; set; }

        [Required]
        [StringLength(500)]
        public string Pattern { get; set; } = string.Empty;
    }

    public class RulePatternFilterDto
    {
        public int RuleId { get; set; }
        public bool? IsActive { get; set; }
        public string? SearchTerm { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 50;
    }

    public class TogglePatternStatusDto
    {
        [Required]
        public int PatternId { get; set; }

        [Required]
        public bool IsActive { get; set; }
    }

    public class DeleteRulePatternDto
    {
        [Required]
        public int PatternId { get; set; }
    }
}