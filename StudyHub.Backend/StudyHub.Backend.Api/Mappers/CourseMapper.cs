using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Dtos.CourseDTOS;

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
        Category = c.SubjectId,
        SchoolId = c.SchoolId,
        IsFeatured = c.IsFeatured,
        Status = c.Status,
        CreatedAt = c.CreatedAt,
        InstructorName = c.CreatedBy,
        UpdatedAt = c.UpdatedAt,
        UpdatedBy = c.UpdatedBy,
        DeletedAt = c.DeletedAt,
        Chapters = c.Chapters?.Select(ch => ch.ToListDto()).ToList() ?? new List<ChapterListDto>()
    };

    // ===================== TO DETAIL DTO =====================
    public static CourseDetailDto ToDetailDto(this Course c) => new CourseDetailDto
    {
        Name = c.Name,
        Information = c.Information,
        ImageUrl = c.ImageUrl,
        Price = c.Price,
        Grade = c.Grade,
        Category = c.SubjectId,
        SchoolId = c.SchoolId,
        IsFeatured = c.IsFeatured,
        Status = c.Status,
        CreatedAt = c.CreatedAt,
        InstructorName = c.CreatedBy,
        UpdatedAt = c.UpdatedAt,
        UpdatedBy = c.UpdatedBy,
        DeletedAt = c.DeletedAt,
        Chapters = c.Chapters?.Select(ch => ch.ToDto()).ToList() ?? new List<ChapterDto>(),
    };

    // ===================== TO ENTITY =====================
    public static Course ToEntity(this CourseDetailDto dto)
    {
        var course = new Course
        {
            Name = dto.Name,
            Information = dto.Information,
            ImageUrl = dto.ImageUrl,
            Price = dto.Price,
            Grade = dto.Grade,
            SubjectId = dto.Category,
            SchoolId = dto.SchoolId,
            IsFeatured = dto.IsFeatured,
            Status = dto.Status,
            CreatedAt = dto.CreatedAt == default ? DateTime.UtcNow : dto.CreatedAt,
            CreatedBy = dto.InstructorName,
            UpdatedAt = dto.UpdatedAt,
            UpdatedBy = dto.UpdatedBy,
            DeletedAt = dto.DeletedAt,
            Chapters = dto.Chapters?.Select(ch => ch.ToEntity()).ToList() ?? new List<Chapter>()
        };

        return course;
    }
}
