using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Dtos.CourseDTOS;
using StudyHub.Backend.Api.Dtos;

namespace StudyHub.Backend.Api.Mappers;

public static class CourseMapper
{
    // ===================== TO LIST DTO =====================
    public static CourseListDto ToListDto(this Course c) => new CourseListDto
    {
        Id = c.Id,
        Name = c.Name,
        Information = c.Information,
        ImageUrl = c.ImageUrl,
        Price = c.Price,
        Grade = c.Grade,
        SubjectId = c.SubjectId,
        SchoolId = c.SchoolId,
        IsFeatured = c.IsFeatured,
        Status = c.Status,
        CreatedAt = c.CreatedAt,
        StartAt = c.StartAt,
        EndAt = c.EndAt,
        UpdatedAt = c.UpdatedAt,
        UpdatedBy = c.UpdatedBy,
        CreatedBy = c.CreatedBy,
        IsApproved = c.IsApproved,
        Chapters = c.Chapters?.Select(ch => ch.ToListDto()).ToList() ?? new List<ChapterListDto>()
    };

    // ===================== TO DETAIL DTO =====================
    public static CourseDto ToDto(this Course c) => new CourseDto
    {
        Name = c.Name,
        Information = c.Information,
        ImageUrl = c.ImageUrl,
        Price = c.Price,
        Grade = c.Grade,
        SubjectId = c.SubjectId,
        SchoolId = c.SchoolId,
        IsFeatured = c.IsFeatured,
        Status = c.Status,
        CreatedAt = c.CreatedAt,
        StartAt = c.StartAt,
        EndAt = c.EndAt,
        UpdatedAt = c.UpdatedAt,
        UpdatedBy = c.UpdatedBy,
        CreatedBy = c.CreatedBy,
        IsApproved = c.IsApproved,
        Chapters = c.Chapters?.Select(ch => ch.ToDto()).ToList() ?? new List<ChapterDto>(),
    };

    // ===================== TO ENTITY =====================
    public static Course ToEntity(this CourseDto dto)
    {
        var course = new Course
        {
            Name = dto.Name,
            Information = dto.Information,
            ImageUrl = dto.ImageUrl,
            Price = dto.Price,
            Grade = dto.Grade,
            SubjectId = dto.SubjectId,
            SchoolId = dto.SchoolId,
            IsFeatured = dto.IsFeatured,
            Status = dto.Status,
            CreatedAt = dto.CreatedAt == default ? DateTime.UtcNow : dto.CreatedAt,
            StartAt = dto.StartAt,
            EndAt = dto.EndAt,
            UpdatedAt = dto.UpdatedAt,
            UpdatedBy = dto.UpdatedBy,
            CreatedBy = dto.CreatedBy,
            IsApproved = dto.IsApproved,
            Chapters = dto.Chapters?.Select(ch => ch.ToEntity()).ToList() ?? new List<Chapter>()
        };

        return course;
    }

    public static List<LandingPageCourseEditDto> ToDisplayDto(this List<Course> list)
        => list.Select(c => new LandingPageCourseEditDto
        {
            Id = c.Id,
            Name = c.Name,
            Grade = c.Grade,
            SubjectName = c.Subject.Name,
            IsFeatured = c.IsFeatured
        }).ToList();
}
