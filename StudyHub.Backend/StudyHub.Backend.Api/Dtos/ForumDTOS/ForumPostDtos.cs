using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace StudyHub.Backend.Api.Dtos.ForumDTOs
{
    public class ForumPostListDto
    {
        public int PostId { get; set; }
        public int SchoolId { get; set; }
        public string? SchoolName { get; set; }
        public short SubjectId { get; set; }
        public string? SubjectName { get; set; }
        public int? FlairId { get; set; }
        public string? FlairName { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string ContentPreview { get; set; } = string.Empty;
        public int TotalViolationScore { get; set; }
        public bool? Status { get; set; }
        public string StatusText { get; set; } = string.Empty;
        public bool IsHidden { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid CreatedBy { get; set; }
        public string? CreatorName { get; set; }
        public string? CreatorAvatar { get; set; }

        // Thêm fields này
        public string? AuthorName { get; set; }
        public string? AuthorInitials { get; set; }
        public string? AuthorClass { get; set; }

        public int CommentCount { get; set; }
        public int AttachmentCount { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? DeletedAt { get; set; }
        public List<ForumAttachmentDto> Attachments { get; set; } = new();
        public List<ForumCommentListDto> Comments { get; set; } = new();
    }

    public class ForumPostDetailDto
    {
        public int PostId { get; set; }
        public int SchoolId { get; set; }
        public string? SchoolName { get; set; }
        public short SubjectId { get; set; }
        public string? SubjectName { get; set; }
        public int? FlairId { get; set; }
        public string? FlairName { get; set; }
        public bool? FlairIsProtected { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public int TotalViolationScore { get; set; }
        public bool? Status { get; set; }
        public string StatusText { get; set; } = string.Empty;
        public bool IsHidden { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid CreatedBy { get; set; }
        public string? CreatorName { get; set; }
        public string? CreatorAvatar { get; set; }
        public string? CreatorFullname { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }
        public DateTime? DeletedAt { get; set; }
        public List<ForumAttachmentDto> Attachments { get; set; } = new();
        public List<ForumCommentListDto> Comments { get; set; } = new();
        public List<ViolationRecordDto> ViolationRecords { get; set; } = new();
    }

    public class CreateForumPostDto
    {
        [Required(ErrorMessage = "Trường học là bắt buộc")]
        public int SchoolId { get; set; }

        [Required(ErrorMessage = "Môn học là bắt buộc")]
        public short SubjectId { get; set; }

        public int? FlairId { get; set; }

        [Required(ErrorMessage = "Tiêu đề là bắt buộc")]
        [StringLength(200, ErrorMessage = "Tiêu đề không được vượt quá 200 ký tự")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Nội dung là bắt buộc")]
        public string Content { get; set; } = string.Empty;

        public List<IFormFile>? Attachments { get; set; }
    }

    public class UpdateForumPostDto
    {
        [Required]
        public int PostId { get; set; }

        public int? FlairId { get; set; }

        [Required(ErrorMessage = "Tiêu đề là bắt buộc")]
        [StringLength(200, ErrorMessage = "Tiêu đề không được vượt quá 200 ký tự")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Nội dung là bắt buộc")]
        public string Content { get; set; } = string.Empty;

        public List<IFormFile>? NewAttachments { get; set; }
        public List<int>? DeletedAttachmentIds { get; set; }
    }

    public class ForumPostFilterDto
    {
        public int SchoolId { get; set; }
        public List<short>? SubjectIds { get; set; }
        public List<int>? FlairIds { get; set; }
        public string? Query { get; set; }
        public string? PostStatus { get; set; }
        public int? MinViolationScore { get; set; }
        public int? MaxViolationScore { get; set; }
        public bool? IsHidden { get; set; }
        public DateTime? CreatedFrom { get; set; }
        public DateTime? CreatedTo { get; set; }
        public string? SortBy { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class ReportPostDto
    {
        [Required]
        public int RuleId { get; set; }

        [Required]
        [StringLength(1000, MinimumLength = 10)]
        public string Reason { get; set; } = string.Empty;
    }

    public class ApprovePostDto
    {
        [Required]
        public int PostId { get; set; }
    }

    public class RejectPostDto
    {
        [Required]
        public int PostId { get; set; }
    }

    public class HidePostDto
    {
        [Required]
        [Range(1, 50)]
        public int ViolationScore { get; set; }

        public string? Reason { get; set; }
    }

    public class UnhidePostDto
    {
        [Required]
        public int PostId { get; set; }
    }
}