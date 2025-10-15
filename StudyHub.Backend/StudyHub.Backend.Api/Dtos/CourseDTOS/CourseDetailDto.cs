using System.Collections.Generic;

namespace StudyHub.Backend.Api.Dtos.CourseDTOS;

public class CourseDetailDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Information { get; set; }
    public string? ImageUrl { get; set; }
    public uint Price { get; set; }
    public short SubjectId { get; set; }
    public sbyte Grade { get; set; }
    public List<ChapterDto> Chapters { get; set; } = new();
}

public class ChapterDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<LessonDto> Lessons { get; set; } = new();
}

public class LessonDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? VideoUrl { get; set; }
    public string? ReadingContent { get; set; }
}
