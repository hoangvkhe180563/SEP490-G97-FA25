using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Dtos;

namespace StudyHub.Backend.Api.Mappers
{
    public static class LessonCommentMapper
    {
        public static LessonCommentListDto ToListDto(this LessonComment c) => new LessonCommentListDto
        {
            Id = c.Id,
            LessonId = c.LessonId,
            AppUserId = c.AppUserId,
            Content = c.Content,
            CreatedAt = c.CreatedAt,
            UserFullname = c.AppUser?.Fullname,
            UserAvatar = c.AppUser?.Avatar
        };
    }
}
