using System.ComponentModel.DataAnnotations;

namespace StudyHub.Backend.Api.Dtos.ForumDTOs
{
    public class ForumAppealListDto
    {
        public int AppealId { get; set; }
        public Guid UserId { get; set; }
        public string? Username { get; set; }
        public string? Fullname { get; set; }
        public string? Avatar { get; set; }
        public int SchoolId { get; set; }
        public string? SchoolName { get; set; }
        public string ReasonPreview { get; set; } = string.Empty;
        public bool? Status { get; set; }
        public string StatusText { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }
        public string? ModeratorName { get; set; }
    }

    public class ForumAppealDetailDto
    {
        public int AppealId { get; set; }
        public Guid UserId { get; set; }
        public string? Username { get; set; }
        public string? Fullname { get; set; }
        public string? Email { get; set; }
        public string? Avatar { get; set; }
        public int SchoolId { get; set; }
        public string? SchoolName { get; set; }
        public string Reason { get; set; } = string.Empty;
        public bool? Status { get; set; }
        public string StatusText { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }
        public string? ModeratorName { get; set; }
        public UserForumStatusDetailDto? UserStatus { get; set; }
        public List<ViolationRecordDto> UserViolations { get; set; } = new();
    }

    public class CreateForumAppealDto
    {
        [Required]
        public int SchoolId { get; set; }

        [Required(ErrorMessage = "Lý do kháng cáo là bắt buộc")]
        [StringLength(2000, MinimumLength = 50, ErrorMessage = "Lý do kháng cáo phải từ 50-2000 ký tự")]
        public string Reason { get; set; } = string.Empty;
    }

    public class ForumAppealFilterDto
    {
        public int SchoolId { get; set; }
        public Guid? UserId { get; set; }
        public bool? Status { get; set; } 
        public DateTime? CreatedFrom { get; set; }
        public DateTime? CreatedTo { get; set; }
        public string? SearchTerm { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class ApproveAppealDto
    {
        [Required]
        public int AppealId { get; set; }

        [StringLength(500)]
        public string? Note { get; set; }

        public bool ResetViolationScore { get; set; } = true;
        public bool UnmuteUser { get; set; } = true;
    }

    public class RejectAppealDto
    {
        [Required]
        public int AppealId { get; set; }

        [StringLength(500, MinimumLength = 10)]
        public string Reason { get; set; } = string.Empty;
    }
}