using System.Collections.Generic;

namespace StudyHub.Backend.Api.Dtos;

public class CourseDetailDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Information { get; set; }
    public string? ImageUrl { get; set; }
    public uint Price { get; set; }
    public short SubjectId { get; set; }
    public sbyte GradeId { get; set; }
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
    public bool IsPreview { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}
