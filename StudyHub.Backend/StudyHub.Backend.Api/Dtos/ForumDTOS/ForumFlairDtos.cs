using System.ComponentModel.DataAnnotations;

namespace StudyHub.Backend.Api.Dtos.ForumDTOs
{
    public class ForumFlairListDto
    {
        public int FlairId { get; set; }
        public int SchoolId { get; set; }
        public string? SchoolName { get; set; }
        public string FlairName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsProtected { get; set; }
        public bool Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid CreatedBy { get; set; }
        public string? CreatorName { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }
        public int PostCount { get; set; }
    }

    public class ForumFlairDetailDto
    {
        public int FlairId { get; set; }
        public int SchoolId { get; set; }
        public string? SchoolName { get; set; }
        public string FlairName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsProtected { get; set; }
        public bool Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid CreatedBy { get; set; }
        public string? CreatorName { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }
        public int PostCount { get; set; }
    }

    public class CreateForumFlairDto
    {
        [Required]
        public int SchoolId { get; set; }

        [Required]
        [StringLength(100)]
        public string FlairName { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        public bool IsProtected { get; set; } = false;
    }

    public class UpdateForumFlairDto
    {
        [Required]
        public int FlairId { get; set; }

        [Required]
        [StringLength(100)]
        public string FlairName { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        public bool IsProtected { get; set; }
    }

    public class ForumFlairFilterDto
    {
        public int SchoolId { get; set; }
        public bool? IsProtected { get; set; }
        public bool? Status { get; set; }
        public string? SearchTerm { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class ToggleFlairStatusDto
    {
        [Required]
        public int FlairId { get; set; }

        [Required]
        public bool Status { get; set; }
    }
}