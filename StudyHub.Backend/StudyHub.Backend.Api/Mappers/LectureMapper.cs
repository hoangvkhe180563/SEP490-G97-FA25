using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Dtos;
using System.Linq;

namespace StudyHub.Backend.Api.Mappers;

public static class LectureMapper
{
    public static ChapterDto ToDto(this Chapter ch) => new ChapterDto
    {
        Id = ch.Id,
        Name = ch.Name,
        Lessons = ch.Lessons?.Select(l => new LessonDto
        {
            Id = l.Id,
            Name = l.Name,
            Type = l.Type,
        }).ToList() ?? new List<LessonDto>()
    };

    public static LessonDto ToDto(this Lesson l) => new LessonDto
    {
        Id = l.Id,
        Name = l.Name,
        Type = l.Type,
    };
}
