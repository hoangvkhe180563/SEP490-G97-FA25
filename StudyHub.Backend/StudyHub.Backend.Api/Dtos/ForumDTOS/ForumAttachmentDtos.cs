using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace StudyHub.Backend.Api.Dtos.ForumDTOs
{
    public class ForumAttachmentListDto
    {
        public int AttachmentId { get; set; }
        public int? PostId { get; set; }
        public string? PostTitle { get; set; }
        public int? CommentId { get; set; }
        public string FileUrl { get; set; } = string.Empty;
        public string? FileName { get; set; }
        public string? FileType { get; set; }
        public long? FileSize { get; set; }
        public bool IsApproved { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid CreatedBy { get; set; }
        public string? CreatorName { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }
        public DateTime? DeletedAt { get; set; }
    }

    public class ForumAttachmentDto
    {
        public int AttachmentId { get; set; }
        public int? PostId { get; set; }
        public int? CommentId { get; set; }
        public string FileUrl { get; set; } = string.Empty;
        public bool IsApproved { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid CreatedBy { get; set; }
    }

    public class ForumAttachmentDetailDto
    {
        public int AttachmentId { get; set; }
        public int? PostId { get; set; }
        public string? PostTitle { get; set; }
        public int? CommentId { get; set; }
        public string FileUrl { get; set; } = string.Empty;
        public string? FileName { get; set; }
        public string? FileType { get; set; }
        public long? FileSize { get; set; }
        public bool IsApproved { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid CreatedBy { get; set; }
        public string? CreatorName { get; set; }
        public string? CreatorFullname { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }
        public string? ModeratorName { get; set; }
        public DateTime? DeletedAt { get; set; }
    }

    public class CreateForumAttachmentDto
    {
        public int? PostId { get; set; }
        public int? CommentId { get; set; }
        public string? Url { get; set; }
        public bool? IsApproved { get; set; }

        [Required]
        public IFormFile File { get; set; } = null!;
    }

    public class ForumAttachmentFilterDto
    {
        public int? PostId { get; set; }
        public int? CommentId { get; set; }
        public bool? IsApproved { get; set; }
        public Guid? CreatedBy { get; set; }
        public DateTime? CreatedFrom { get; set; }
        public DateTime? CreatedTo { get; set; }
        public bool IncludeDeleted { get; set; } = false;
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class ApproveAttachmentDto
    {
        [Required]
        public int AttachmentId { get; set; }
    }

    public class RejectAttachmentDto
    {
        [Required]
        public int AttachmentId { get; set; }

        [StringLength(500)]
        public string? Reason { get; set; }
    }

    public class DeleteAttachmentDto
    {
        [Required]
        public int AttachmentId { get; set; }
    }

    public class BulkApproveAttachmentsDto
    {
        [Required]
        [MinLength(1)]
        public List<int> AttachmentIds { get; set; } = new();
    }

    public class BulkRejectAttachmentsDto
    {
        [Required]
        [MinLength(1)]
        public List<int> AttachmentIds { get; set; } = new();

        [StringLength(500)]
        public string? Reason { get; set; }
    }
}