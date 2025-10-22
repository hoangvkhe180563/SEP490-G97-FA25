using StudyHub.Backend.Domain.Entities;
using System.Collections.Generic;

namespace StudyHub.Backend.Api.Dtos.CourseDTOS;

public class CourseDetailDto
{
    public string Name { get; set; } = null!;
    public string? Information { get; set; }
    public string? ImageUrl { get; set; }
    public uint Price { get; set; }
    public sbyte Grade { get; set; }
    public short Category { get; set; }
    public int? SchoolId { get; set; }
    public bool IsFeatured { get; set; }
    public bool? Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid InstructorName { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
    public DateTime? DeletedAt { get; set; }
    public List<ChapterDto> Chapters { get; set; } = new();
}

public class ChapterDto
{
    public string Name { get; set; } = null!;
    public int CourseId { get; set; }
    public bool? Status { get; set; }
    public List<LessonDto> Lessons { get; set; } = new();
    public string? Description { get; set; }
    public DateTime? PostDate { get; set; }
}

public class LessonDto
{
    public string Name { get; set; } = null!;
    public int ChapterId { get; set; }
    public bool? Status { get; set; }
    public string Type { get; set; } = null!;
    public string? VideoUrl { get; set; }
    public string? ReadingContent { get; set; }
    public string? Duration { get; set; }
    public string? Description { get; set; }
    public DateTime? PostDate { get; set; }
    public bool? IsPreview { get; set; }
}

public class EnrollmentDto
{
    public Guid AppUserId { get; set; }
    public int CourseId { get; set; }
    public DateTime EnrollmentDate { get; set; }
}
public class ProgressDto
{
    public int EnrollmentId { get; set; }
    public int LessonId { get; set; }
    public DateTime CompletionDate { get; set; }
}
