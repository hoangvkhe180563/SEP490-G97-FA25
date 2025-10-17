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
            Grade = d.Grade,
            DocumentCategoryId = (byte)d.DocumentCategoryId,
            CategoryName = d.DocumentCategory?.Name,
            SchoolId = d.SchoolId,
            SchoolName = d.School?.Name,
            ClassId = d.ClassId,
            CreatedAt = d.CreatedAt,
            IsFeatured = d.IsFeatured,
            IsApproved = d.IsApproved,
            Status = d.Status,
            FileType = GetFileType(d.DocumentUrl)
        };

        public static DocumentDetailDto ToDetailDto(this Document d) => new DocumentDetailDto
        {
            Id = d.Id,
            Name = d.Name,
            DocumentUrl = d.DocumentUrl,
            Thumbnail = d.Thumbnail,
            SubjectId = d.SubjectId,
            SubjectName = d.Subject?.Name,
            Grade = d.Grade,
            DocumentCategoryId = (byte)d.DocumentCategoryId,
            CategoryName = d.DocumentCategory?.Name,
            SchoolId = d.SchoolId,
            SchoolName = d.School?.Name,
            ClassId = d.ClassId,
            Description = d.Description,
            CreatedAt = d.CreatedAt,
            CreatedBy = d.CreatedBy,
            UpdatedAt = d.UpdatedAt,
            UpdatedBy = d.UpdatedBy,
            IsFeatured = d.IsFeatured,
            IsApproved = d.IsApproved,
            Status = d.Status,
            FileType = GetFileType(d.DocumentUrl)

        };

        public static Document ToEntity(this CreateDocumentDto dto) => new Document
        {
            Name = dto.Name,
            SubjectId = dto.SubjectId,
            Grade = dto.Grade,
            DocumentCategoryId = dto.DocumentCategoryId,
            Description = dto.Description,
            SchoolId = dto.SchoolId,
            ClassId = dto.ClassId,
            IsFeatured = dto.IsFeatured,
            CreatedBy = dto.CreatedBy
        };

        public static Document ToEntity(this UpdateDocumentDto dto) => new Document
        {
            Id = dto.Id,
            Name = dto.Name,
            SubjectId = dto.SubjectId,
            Grade = dto.Grade,
            DocumentCategoryId = dto.DocumentCategoryId,
            Description = dto.Description,
            SchoolId = dto.SchoolId,
            ClassId = dto.ClassId,
            IsFeatured = dto.IsFeatured,
            UpdatedBy = dto.UpdatedBy
        };

        private static string? GetFileType(string? documentUrl)
        {
            if (string.IsNullOrEmpty(documentUrl))
                return null;

            var extension = System.IO.Path.GetExtension(documentUrl).ToLowerInvariant();
            return extension.TrimStart('.');
        }
    }
}