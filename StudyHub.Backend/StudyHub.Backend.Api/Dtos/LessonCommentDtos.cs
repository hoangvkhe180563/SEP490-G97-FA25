using System;
namespace StudyHub.Backend.Api.Dtos
{
    public class CreateLessonCommentDto
    {
        public int LessonId { get; set; }
        public string Content { get; set; } = string.Empty;
    }

    public class LessonCommentListDto
    {
        public int Id { get; set; }
        public int LessonId { get; set; }
        public Guid AppUserId { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string? UserFullname { get; set; }
        public string? UserAvatar { get; set; }
    }

    public class UpdateLessonCommentDto
    {
        public string Content { get; set; } = string.Empty;
    }
}
