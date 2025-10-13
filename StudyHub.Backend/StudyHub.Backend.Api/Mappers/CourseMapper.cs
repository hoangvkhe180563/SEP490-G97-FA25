using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Dtos;

namespace StudyHub.Backend.Api.Mappers;

public static class CourseMapper
{
    public static CourseListDto ToListDto(this Course c) => new CourseListDto
    {
        Id = c.Id,
        Name = c.Name,
        Information = c.Information,
        ImageUrl = c.ImageUrl,
        Price = c.Price
    };

    public static CourseDetailDto ToDetailDto(this Course c) => new CourseDetailDto
    {
        Id = c.Id,
        Name = c.Name,
        Information = c.Information,
        ImageUrl = c.ImageUrl,
        Price = c.Price,
        SubjectId = c.SubjectId,
        GradeId = c.GradeId,
        Chapters = c.Chapters?.Select(ch => new ChapterDto
        {
            Id = ch.Id,
            Name = ch.Name,
            Lessons = ch.Lessons?.Select(l => new LessonDto
            {
                Id = l.Id,
                Name = l.Name,
                IsPreview = l.IsPreview,
                Type = l.Type
            }).ToList() ?? new List<LessonDto>()
        }).ToList() ?? new List<ChapterDto>()
    };
}
