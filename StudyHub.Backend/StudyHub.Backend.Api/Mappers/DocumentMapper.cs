using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Dtos;

namespace StudyHub.Backend.Api.Mappers
{
    public static class DocumentMapper
    {
        public static DocumentListDto ToListDto(this Document d) => new DocumentListDto
        {
            Id = d.Id,
            Name = d.Name,
            DocumentUrl = d.DocumentUrl,
            Thumbnail = d.Thumbnail,
            Description = d.Description,
            SubjectId = d.SubjectId,
            SubjectName = d.Subject?.Name,
            GradeId = (byte)d.GradeId,
            GradeName = d.Grade?.Name,
            DocumentCategoryId = (byte)d.DocumentCategoryId,
            CategoryName = d.DocumentCategory?.Name,
            AccessibilityId = (byte)d.AccessibilityId,
            AccessibilityName = d.Accessibility?.Name,
            SchoolId = d.SchoolId,
            SchoolName = d.School?.Name,
            CreatedAt = d.CreatedAt,
            IsFeatured = d.IsFeatured,
            IsApproved = d.IsApproved,
            Status = d.Status
        };

        public static DocumentDetailDto ToDetailDto(this Document d) => new DocumentDetailDto
        {
            Id = d.Id,
            Name = d.Name,
            DocumentUrl = d.DocumentUrl,
            Thumbnail = d.Thumbnail,
            SubjectId = d.SubjectId,
            SubjectName = d.Subject?.Name,
            GradeId = d.GradeId,
            GradeName = d.Grade?.Name,
            DocumentCategoryId = (byte)d.DocumentCategoryId,
            CategoryName = d.DocumentCategory?.Name,
            AccessibilityId = d.AccessibilityId,
            AccessibilityName = d.Accessibility?.Name,
            SchoolId = d.SchoolId,
            SchoolName = d.School?.Name,
            Description = d.Description,
            CreatedAt = d.CreatedAt,
            CreatedBy = d.CreatedBy,
            UpdatedAt = d.UpdatedAt,
            UpdatedBy = d.UpdatedBy,
            IsFeatured = d.IsFeatured,
            IsApproved = d.IsApproved,
            Status = d.Status
        };

        public static Document ToEntity(this CreateDocumentDto dto) => new Document
        {
            Name = dto.Name,
            SubjectId = dto.SubjectId,
            GradeId = dto.GradeId,
            DocumentCategoryId = dto.DocumentCategoryId,
            AccessibilityId = dto.AccessibilityId,
            Description = dto.Description,
            SchoolId = dto.SchoolId,
            IsFeatured = dto.IsFeatured,
            CreatedBy = dto.CreatedBy
        };

        public static Document ToEntity(this UpdateDocumentDto dto) => new Document
        {
            Id = dto.Id,
            Name = dto.Name,
            SubjectId = dto.SubjectId,
            GradeId = dto.GradeId,
            DocumentCategoryId = dto.DocumentCategoryId,
            AccessibilityId = dto.AccessibilityId,
            Description = dto.Description,
            SchoolId = dto.SchoolId,
            IsFeatured = dto.IsFeatured,
            UpdatedBy = dto.UpdatedBy
        };
    }
}