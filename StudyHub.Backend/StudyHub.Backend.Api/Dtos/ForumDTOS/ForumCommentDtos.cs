using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace StudyHub.Backend.Api.Dtos.ForumDTOs
{
    public class ForumCommentListDto
    {
        public int CommentId { get; set; }
        public int PostId { get; set; }
        public int? ParentCommentId { get; set; }
        public string Content { get; set; } = string.Empty;
        public int TotalViolationScore { get; set; }
        public bool? Status { get; set; }
        public string StatusText { get; set; } = string.Empty;
        public bool IsHidden { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid CreatedBy { get; set; }
        public string? CreatorName { get; set; }
        public string? CreatorAvatar { get; set; }
        public string? AuthorName { get; set; }
        public string? AuthorInitials { get; set; }

        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }
        public DateTime? DeletedAt { get; set; }
        public int ReplyCount { get; set; }
        public List<ForumCommentListDto> Replies { get; set; } = new();
        public List<ForumAttachmentDto> Attachments { get; set; } = new();
    }

    public class ForumCommentDetailDto
    {
        public int CommentId { get; set; }
        public int PostId { get; set; }
        public string? PostTitle { get; set; }
        public int? ParentCommentId { get; set; }
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
        public int ReplyCount { get; set; }
        public List<ForumCommentListDto> Replies { get; set; } = new();
        public List<ForumAttachmentDto> Attachments { get; set; } = new();
        public List<ViolationRecordDto> ViolationRecords { get; set; } = new();
    }

    public class CreateForumCommentDto
    {
        [Required(ErrorMessage = "Post ID là bắt buộc")]
        public int PostId { get; set; }

        public int? ParentCommentId { get; set; }

        [Required(ErrorMessage = "Nội dung là bắt buộc")]
        [StringLength(2000, ErrorMessage = "Nội dung không được vượt quá 2000 ký tự")]
        public string Content { get; set; } = string.Empty;

        public List<IFormFile>? Attachments { get; set; }
    }

    public class UpdateForumCommentDto
    {
        [Required]
        public int CommentId { get; set; }

        [Required(ErrorMessage = "Nội dung là bắt buộc")]
        [StringLength(2000, ErrorMessage = "Nội dung không được vượt quá 2000 ký tự")]
        public string Content { get; set; } = string.Empty;

        public List<IFormFile>? NewAttachments { get; set; }
        public List<int>? DeletedAttachmentIds { get; set; }
    }

    public class ForumCommentFilterDto
    {
        public int SchoolId { get; set; }
        public int? PostId { get; set; }
        public Guid? CreatedBy { get; set; }
        public string? CommentStatus { get; set; }
        public int? MinViolationScore { get; set; }
        public bool? IsHidden { get; set; }
        public DateTime? CreatedFrom { get; set; }
        public DateTime? CreatedTo { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 50;
    }

    public class ReportCommentDto
    {
        [Required]
        public int RuleId { get; set; }

        [Required]
        [StringLength(1000, MinimumLength = 10)]
        public string Reason { get; set; } = string.Empty;
    }

    public class ApproveCommentDto
    {
        [Required]
        public int CommentId { get; set; }
    }

    public class RejectCommentDto
    {
        [Required]
        public int CommentId { get; set; }
    }

    public class HideCommentDto
    {
        [Required]
        [Range(1, 50)]
        public int ViolationScore { get; set; }

        public string? Reason { get; set; }
    }

    public class UnhideCommentDto
    {
        [Required]
        public int CommentId { get; set; }
    }
}