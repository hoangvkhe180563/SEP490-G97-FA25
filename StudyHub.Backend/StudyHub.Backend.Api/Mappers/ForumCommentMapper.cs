using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Dtos.ForumDTOs;

namespace StudyHub.Backend.Api.Mappers
{
    public static class ForumCommentMapper
    {
        public static ForumCommentListDto ToListDto(this ForumComment comment)
        {
            var authorName = comment.Creator?.Username ?? "Unknown";
            var authorInitials = comment.Creator?.Username?.Length >= 2
                ? comment.Creator.Username.Substring(0, 2).ToUpper()
                : "U";

            return new ForumCommentListDto
            {
                CommentId = comment.CommentId,
                PostId = comment.PostId,
                ParentCommentId = comment.ParentCommentId,
                Content = comment.Content ?? string.Empty,
                TotalViolationScore = comment.TotalViolationScore,
                Status = comment.Status,
                StatusText = comment.Status == null
                    ? "Pending"
                    : (comment.Status.Value ? "Approved" : "Rejected"),
                IsHidden = comment.IsHidden,
                CreatedAt = comment.CreatedAt,
                CreatedBy = comment.CreatedBy,
                CreatorName = authorName,
                CreatorAvatar = comment.Creator?.Avatar,

                AuthorName = authorName,
                AuthorInitials = authorInitials,

                UpdatedAt = comment.UpdatedAt,
                ReplyCount = comment.ReplyCount,
                Replies = comment.Replies?.Select(r => r.ToListDto()).ToList() ?? new List<ForumCommentListDto>(),
                Attachments = comment.Attachments?
                    .Where(a => a.IsApproved == true)
                    .Select(a => new ForumAttachmentDto
                    {
                        AttachmentId = a.Id,
                        CommentId = a.CommentId,
                        FileUrl = a.FileUrl ?? string.Empty,
                        IsApproved = a.IsApproved,
                        CreatedAt = a.CreatedAt
                    }).ToList() ?? new List<ForumAttachmentDto>()
            };
        }

        public static ForumCommentDetailDto ToDetailDto(this ForumComment comment)
        {
            return new ForumCommentDetailDto
            {
                CommentId = comment.CommentId,
                PostId = comment.PostId,
                ParentCommentId = comment.ParentCommentId,
                Content = comment.Content,
                TotalViolationScore = comment.TotalViolationScore,
                Status = comment.Status,
                StatusText = comment.Status == null
                    ? "Pending"
                    : (comment.Status.Value ? "Approved" : "Rejected"),
                IsHidden = comment.IsHidden,
                CreatedAt = comment.CreatedAt,
                CreatedBy = comment.CreatedBy,
                CreatorName = comment.Creator?.Username,
                CreatorAvatar = comment.Creator?.Avatar,
                CreatorFullname = comment.Creator?.Fullname,
                UpdatedAt = comment.UpdatedAt,
                ReplyCount = comment.ReplyCount,
                Replies = comment.Replies?.Select(r => r.ToListDto()).ToList()
                    ?? new List<ForumCommentListDto>(),
                Attachments = comment.Attachments?.Select(a => new ForumAttachmentDto
                {
                    AttachmentId = a.Id,
                    CommentId = a.CommentId,
                    FileUrl = a.FileUrl,
                    IsApproved = a.IsApproved,
                    CreatedAt = a.CreatedAt
                }).ToList() ?? new List<ForumAttachmentDto>(),
                ViolationRecords = comment.ViolationRecords?.Select(v => new ViolationRecordDto
                {
                    RecordId = v.Id,
                    UserId = v.UserId,
                    Username = v.User?.Username,
                    SchoolId = v.SchoolId,
                    CommentId = v.CommentId,
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

        public static ForumComment ToEntity(this CreateForumCommentDto dto, Guid createdBy, int schoolId)
        {
            return new ForumComment
            {
                PostId = dto.PostId,
                SchoolId = schoolId,
                ParentCommentId = dto.ParentCommentId,
                Content = dto.Content,
                CreatedBy = createdBy,
                CreatedAt = DateTime.Now
            };
        }

        public static ForumComment ToEntity(this UpdateForumCommentDto dto, ForumComment existingComment)
        {
            existingComment.Content = dto.Content;
            existingComment.UpdatedAt = DateTime.Now;

            return existingComment;
        }
    }
}