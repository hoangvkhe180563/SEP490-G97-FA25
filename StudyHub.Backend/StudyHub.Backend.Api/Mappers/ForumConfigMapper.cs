using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Dtos.ForumDTOs;

namespace StudyHub.Backend.Api.Mappers
{
    public static class ForumConfigMapper
    {

        public static ForumFlairListDto ToListDto(this ForumFlair flair)
        {
            return new ForumFlairListDto
            {
                FlairId = flair.Id,
                SchoolId = flair.SchoolId,
                FlairName = flair.Name,
                Description = flair.Description,
                IsProtected = flair.IsProtected,
                Status = flair.Status ?? true,
                CreatedAt = flair.CreatedAt,
                UpdatedAt = flair.UpdatedAt
            };
        }

        public static ForumFlairDetailDto ToDetailDto(this ForumFlair flair)
        {
            return new ForumFlairDetailDto
            {
                FlairId = flair.Id,
                SchoolId = flair.SchoolId,
                FlairName = flair.Name,
                Description = flair.Description,
                IsProtected = flair.IsProtected,
                Status = flair.Status ?? true,
                CreatedAt = flair.CreatedAt,
                CreatedBy = flair.CreatedBy ?? Guid.Empty,
                UpdatedAt = flair.UpdatedAt,
                UpdatedBy = flair.UpdatedBy
            };
        }

        public static ForumFlair ToEntity(this CreateForumFlairDto dto, Guid createdBy, int schoolId)
        {
            return new ForumFlair
            {
                SchoolId = schoolId,
                Name = dto.FlairName,
                Description = dto.Description,
                IsProtected = dto.IsProtected,
                //Status = dto.Status ?? true,
                CreatedAt = DateTime.Now,
                CreatedBy = createdBy
            };
        }

        public static ForumFlair ToEntity(this UpdateForumFlairDto dto, ForumFlair existingFlair)
        {
            existingFlair.Name = dto.FlairName;
            existingFlair.Description = dto.Description;
            existingFlair.IsProtected = dto.IsProtected ;
            existingFlair.UpdatedAt = DateTime.Now;

            return existingFlair;
        }

        public static ForumAttachmentDto ToDto(this ForumAttachment attachment)
        {
            return new ForumAttachmentDto
            {
                AttachmentId = attachment.Id,
                PostId = attachment.PostId,
                CommentId = attachment.CommentId,
                FileUrl = attachment.FileUrl,
                IsApproved = attachment.IsApproved,
                CreatedAt = attachment.CreatedAt,
                CreatedBy = attachment.CreatedBy ?? Guid.Empty
            };
        }

        public static ForumAttachmentDetailDto ToDetailDto(this ForumAttachment attachment)
        {
            return new ForumAttachmentDetailDto
            {
                AttachmentId = attachment.Id,
                PostId = attachment.PostId,
                CommentId = attachment.CommentId,
                FileUrl = attachment.FileUrl,
                IsApproved = attachment.IsApproved,
                CreatedAt = attachment.CreatedAt,
                CreatedBy = attachment.CreatedBy ?? Guid.Empty,
                UpdatedAt = attachment.UpdatedAt,
                UpdatedBy = attachment.UpdatedBy,
                DeletedAt = attachment.DeletedAt
            };
        }

        public static ForumAttachment ToEntity(this CreateForumAttachmentDto dto, Guid createdBy)
        {
            return new ForumAttachment
            {
                PostId = dto.PostId,
                CommentId = dto.CommentId,
                FileUrl = dto.Url,
                IsApproved = dto.IsApproved ?? false,
                CreatedAt = DateTime.Now,
                CreatedBy = createdBy
            };
        }
    }
}