using System.ComponentModel.DataAnnotations;

namespace StudyHub.Backend.Api.Dtos.ForumDTOs
{
    public class UserForumStatusListDto
    {
        public Guid UserId { get; set; }
        public string? Username { get; set; }
        public string? Fullname { get; set; }
        public string? Avatar { get; set; }
        public int SchoolId { get; set; }
        public string? SchoolName { get; set; }
        public int TotalViolationScore { get; set; }
        public bool IsMute { get; set; }
        public DateTime? MuteUntil { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class UserForumStatusDetailDto
    {
        public Guid UserId { get; set; }
        public string? Username { get; set; }
        public string? Fullname { get; set; }
        public string? Email { get; set; }
        public string? Avatar { get; set; }
        public int SchoolId { get; set; }
        public string? SchoolName { get; set; }
        public int TotalViolationScore { get; set; }
        public bool IsMute { get; set; }
        public DateTime? MuteUntil { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int TotalPosts { get; set; }
        public int TotalComments { get; set; }
        public int TotalViolations { get; set; }
        public List<ViolationRecordDto> RecentViolations { get; set; } = new();
    }

    public class UserForumStatusFilterDto
    {
        public int SchoolId { get; set; }
        public bool? IsMute { get; set; }
        public int? MinViolationScore { get; set; }
        public int? MaxViolationScore { get; set; }
        public DateTime? MutedFrom { get; set; }
        public DateTime? MutedTo { get; set; }
        public string? SearchTerm { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class MuteUserDto
    {
        [Required]
        public Guid UserId { get; set; }

        [Required]
        public int SchoolId { get; set; }

        [Required]
        public DateTime MuteUntil { get; set; }

        [StringLength(500)]
        public string? Reason { get; set; }
    }

    public class UnmuteUserDto
    {
        [Required]
        public Guid UserId { get; set; }

        [Required]
        public int SchoolId { get; set; }
    }

    public class AdjustViolationScoreDto
    {
        [Required]
        public Guid UserId { get; set; }

        [Required]
        public int SchoolId { get; set; }

        [Required]
        [Range(-100, 100)]
        public int ScoreAdjustment { get; set; } 

        [StringLength(500)]
        public string? Reason { get; set; }
    }

    public class ResetUserViolationScoreDto
    {
        [Required]
        public Guid UserId { get; set; }

        [Required]
        public int SchoolId { get; set; }

        [StringLength(500)]
        public string? Reason { get; set; }
    }
}