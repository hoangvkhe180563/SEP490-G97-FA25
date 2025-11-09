using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Dtos.ForumDTOs;

namespace StudyHub.Backend.Api.Mappers
{
    public static class ForumPostMapper
    {
        public static ForumPostListDto ToListDto(this ForumPost post)
        {
            var authorName = post.Creator?.Username ?? "Unknown";
            var authorInitials = post.Creator?.Username?.Length >= 2
                ? post.Creator.Username.Substring(0, 2).ToUpper()
                : "U";

            return new ForumPostListDto
            {
                PostId = post.Id,
                SchoolId = post.SchoolId,
                SchoolName = post.School?.Name,
                SubjectId = post.SubjectId,
                SubjectName = post.Subject?.Name,
                FlairId = post.FlairId,
                FlairName = post.Flair?.Name,
                Title = post.Title,
                Content = post.Content ?? string.Empty,
                ContentPreview = (post.Content?.Length ?? 0) > 200
                    ? post.Content!.Substring(0, 200) + "..."
                    : post.Content ?? string.Empty,
                TotalViolationScore = post.TotalViolationScore,
                Status = post.Status,
                StatusText = post.Status == null
                    ? "Pending"
                    : (post.Status.Value ? "Approved" : "Rejected"),
                IsHidden = post.IsHidden,
                CreatedAt = post.CreatedAt,
                CreatedBy = post.CreatedBy,
                CreatorName = authorName,
                CreatorAvatar = post.Creator?.Avatar,

                AuthorName = authorName,
                Attachments = post.Attachments?.Select(a => new ForumAttachmentDto
                {
                    AttachmentId = a.Id,
                    CommentId = a.CommentId,
                    FileUrl = a.FileUrl,
                    IsApproved = a.IsApproved,
                    CreatedAt = a.CreatedAt,
                    CreatedBy = a.CreatedBy ?? Guid.Empty
                }).ToList() ?? new List<ForumAttachmentDto>(),

                Comments = post.Comments?.Select(c => new ForumCommentListDto
                {
                    CommentId = c.CommentId,
                    PostId = c.PostId,
                    ParentCommentId = c.ParentCommentId,
                    Content = c.Content ?? string.Empty,
                    TotalViolationScore = c.TotalViolationScore,
                    Status = c.Status,
                    StatusText = c.Status == null
                        ? "Pending"
                        : (c.Status.Value ? "Approved" : "Rejected"),
                    IsHidden = c.IsHidden,
                    CreatedAt = c.CreatedAt,
                    CreatedBy = c.CreatedBy,
                    CreatorName = c.Creator?.Username ?? "Unknown",
                    CreatorAvatar = c.Creator?.Avatar,
                    UpdatedAt = c.UpdatedAt,
                    ReplyCount = c.ReplyCount,
                    Replies = c.Replies?.Select(r => r.ToListDto()).ToList()
        ?? new List<ForumCommentListDto>(),
                    Attachments = c.Attachments?.Where(a => a.IsApproved == true)
        .Select(a => new ForumAttachmentDto
        {
            AttachmentId = a.Id,
            CommentId = a.CommentId,
            FileUrl = a.FileUrl ?? string.Empty,
            IsApproved = a.IsApproved,
            CreatedAt = a.CreatedAt
        }).ToList()
        ?? new List<ForumAttachmentDto>()
                }).ToList() ?? new List<ForumCommentListDto>(),
                CommentCount = post.CommentCount,
                AttachmentCount = post.AttachmentCount,
                UpdatedAt = post.UpdatedAt
            };
        }
        public static ForumPostDetailDto ToDetailDto(this ForumPost post)
        {
            return new ForumPostDetailDto
            {
                PostId = post.Id,
                SchoolId = post.SchoolId,
                SchoolName = post.School?.Name,
                SubjectId = post.SubjectId,
                SubjectName = post.Subject?.Name,
                FlairId = post.FlairId,
                FlairName = post.Flair?.Name,
                FlairIsProtected = post.Flair?.IsProtected,
                Title = post.Title,
                Content = post.Content,
                TotalViolationScore = post.TotalViolationScore,
                Status = post.Status,
                StatusText = post.Status == null
                    ? "Pending"
                    : (post.Status.Value ? "Approved" : "Rejected"),
                IsHidden = post.IsHidden,
                CreatedAt = post.CreatedAt,
                CreatedBy = post.CreatedBy,
                CreatorName = post.Creator?.Username,
                CreatorAvatar = post.Creator?.Avatar,
                CreatorFullname = post.Creator?.Fullname,
                UpdatedAt = post.UpdatedAt,
                Attachments = post.Attachments?.Select(a => new ForumAttachmentDto
                {
                    AttachmentId = a.Id,
                    PostId = a.PostId,
                    FileUrl = a.FileUrl,
                    IsApproved = a.IsApproved,
                    CreatedAt = a.CreatedAt
                }).ToList() ?? new List<ForumAttachmentDto>(),
                Comments = post.Comments?.Select(c => new ForumCommentListDto
                {
                    CommentId = c.CommentId,
                    PostId = c.PostId,
                    ParentCommentId = c.ParentCommentId,
                    Content = c.Content ?? string.Empty,
                    TotalViolationScore = c.TotalViolationScore,
                    Status = c.Status,
                    StatusText = c.Status == null
                        ? "Pending"
                        : (c.Status.Value ? "Approved" : "Rejected"),
                    IsHidden = c.IsHidden,
                    CreatedAt = c.CreatedAt,
                    CreatedBy = c.CreatedBy,
                    CreatorName = c.Creator?.Username ?? "Unknown",
                    CreatorAvatar = c.Creator?.Avatar,
                    UpdatedAt = c.UpdatedAt,
                    ReplyCount = c.ReplyCount,
                    Replies = c.Replies?.Select(r => r.ToListDto()).ToList()
                        ?? new List<ForumCommentListDto>(),
                    Attachments = c.Attachments?
                        .Where(a => a.IsApproved == true)
                        .Select(a => new ForumAttachmentDto
                        {
                            AttachmentId = a.Id,
                            CommentId = a.CommentId,
                            FileUrl = a.FileUrl ?? string.Empty,
                            IsApproved = a.IsApproved,
                            CreatedAt = a.CreatedAt
                        }).ToList() ?? new List<ForumAttachmentDto>()
                }).ToList() ?? new List<ForumCommentListDto>(),
                ViolationRecords = post.ViolationRecords?.Select(v => new ViolationRecordDto
                {
                    RecordId = v.Id,
                    UserId = v.UserId,
                    Username = v.User?.Username,
                    SchoolId = v.SchoolId,
                    PostId = v.PostId,
                    MatchedRuleId = v.MatchedRuleId,
                    RuleName = v.Rule?.Name,
                    MatchedPatternId = v.MatchedPatternId,
                    PatternText = v.Pattern?.Pattern,
                    ViolationScore = v.ViolationScore,
                    SourceType = v.SourceType,
                    ReportedBy = v.ReportedBy,
                    CreatedAt = v.CreatedAt
                }).ToList() ?? new List<ViolationRecordDto>()
            };
        }

        public static ForumPost ToEntity(this CreateForumPostDto dto, Guid createdBy)
        {
            return new ForumPost
            {
                SchoolId = dto.SchoolId,
                SubjectId = dto.SubjectId,
                FlairId = dto.FlairId,
                Title = dto.Title,
                Content = dto.Content,
                CreatedBy = createdBy,
                CreatedAt = DateTime.Now
            };
        }

        public static ForumPost ToEntity(this UpdateForumPostDto dto, ForumPost existingPost)
        {
            existingPost.FlairId = dto.FlairId;
            existingPost.Title = dto.Title;
            existingPost.Content = dto.Content;
            existingPost.UpdatedAt = DateTime.Now;

            return existingPost;
        }
    }
}