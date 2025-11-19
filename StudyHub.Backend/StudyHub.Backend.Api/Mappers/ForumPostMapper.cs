using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Dtos.ForumDTOs;

namespace StudyHub.Backend.Api.Mappers
{
    public static class ForumPostMapper
    {
        public static ForumPostListDto ToListDto(this ForumPost post, Guid? currentUserId = null, bool isModerator = false)
        {
            var authorName = post.Creator?.Username ?? "Unknown";
            var authorInitials = post.Creator?.Username?.Length >= 2
                ? post.Creator.Username.Substring(0, 2).ToUpper()
                : "U";

            bool isOwner = currentUserId.HasValue && post.CreatedBy == currentUserId.Value;
            bool isAutoDetected = post.IsHidden && post.Status == false;
            bool isManuallyHidden = post.TotalViolationScore >= 10 && !post.IsHidden && post.Status == true;
            bool shouldMaskContent = isManuallyHidden && !isOwner && !isModerator;
            bool shouldHideFromPublic = isAutoDetected && !isOwner && !isModerator;

            if (shouldHideFromPublic)
            {
                return null;
            }
            return new ForumPostListDto
            {
                PostId = post.Id,
                SchoolId = post.SchoolId,
                SchoolName = post.School?.Name,
                SubjectId = post.SubjectId,
                SubjectName = post.Subject?.Name,
                FlairId = post.FlairId,
                FlairName = post.Flair?.Name,
                Title = shouldMaskContent ? "[Bài viết vi phạm]" : post.Title,
                Content = shouldMaskContent ? "" : (post.Content ?? string.Empty),
                ContentPreview = shouldMaskContent
                ? "[Bài viết vi phạm]"
                : ((post.Content?.Length ?? 0) > 200
                    ? post.Content!.Substring(0, 200) + "..."
                    : post.Content ?? string.Empty),
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
                AuthorInitials = authorInitials,
                AuthorName = authorName,
                Attachments = shouldMaskContent
                ? new List<ForumAttachmentDto>()
                : (post.Attachments?.Select(a => new ForumAttachmentDto
                {
                    AttachmentId = a.Id,
                    CommentId = a.CommentId,
                    FileUrl = a.FileUrl,
                    IsApproved = a.IsApproved,
                    CreatedAt = a.CreatedAt,
                    CreatedBy = a.CreatedBy ?? Guid.Empty
                }).ToList() ?? new List<ForumAttachmentDto>()),
                Comments = post.Comments?.Select(c => c.ToListDto(currentUserId, isModerator)).ToList()
                ?? new List<ForumCommentListDto>(),
                CommentCount = post.CommentCount,
                AttachmentCount = post.AttachmentCount,
                UpdatedAt = post.UpdatedAt
            };
        }
        public static ForumPostDetailDto ToDetailDto(this ForumPost post, Guid? currentUserId = null, bool isModerator = false)
        {
            bool isOwner = currentUserId.HasValue && post.CreatedBy == currentUserId.Value;
            bool isAutoDetected = post.IsHidden && post.Status == false;
            bool isManuallyHidden = post.TotalViolationScore >= 10 && !post.IsHidden && post.Status == true;
            bool shouldMaskContent = isManuallyHidden && !isOwner && !isModerator;
            bool shouldHideFromPublic = isAutoDetected && !isOwner && !isModerator;

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
                Title = shouldMaskContent ? "[Bài viết vi phạm]" : post.Title,
                Content = shouldMaskContent ? "Nội dung này đã bị ẩn do vi phạm quy định cộng đồng." : post.Content,
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
                Attachments = shouldMaskContent
                    ? new List<ForumAttachmentDto>()
                    : (post.Attachments?.Select(a => new ForumAttachmentDto
                    {
                        AttachmentId = a.Id,
                        PostId = a.PostId,
                        FileUrl = a.FileUrl,
                        IsApproved = a.IsApproved,
                        CreatedAt = a.CreatedAt
                    }).ToList() ?? new List<ForumAttachmentDto>()),
                Comments = post.Comments?.Select(c => c.ToListDto(currentUserId, isModerator)).ToList()
                    ?? new List<ForumCommentListDto>(),
                ViolationRecords = isModerator || isOwner
                    ? (post.ViolationRecords?.Select(v => v.ToDto()).ToList() ?? new List<ViolationRecordDto>())
                    : new List<ViolationRecordDto>()
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