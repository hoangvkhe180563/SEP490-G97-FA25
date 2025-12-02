using StudyHub.Backend.Domain.Entities;
using StudyHub.Backend.Api.Dtos;
using StudyHub.Backend.Api.Dtos.ClassDTOS;
using System.Linq;

namespace StudyHub.Backend.Api.Mappers
{
    public static class DocumentMapper
    {

        public static DocumentListDto ToListDto(this Document d)
        {
            return new DocumentListDto
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
                IsInClass = d.IsInClass,
                CreatedAt = d.CreatedAt,
                IsFeatured = d.IsFeatured,
                IsApproved = d.IsApproved,
                Status = d.Status ?? true,
                FileType = GetFileType(d.DocumentUrl),
                UploaderName = d.Username?.Fullname ?? d.Username?.Username,
                DocumentLengthType = d.DocumentLengthType,
                DocumentLevel = d.DocumentLevel,
                classes = d.Classes?.Select(c => new ClassListDto
                {
                    Id = c.Id,
                    Name = c.Name
                }).ToList() ?? new List<ClassListDto>(),
                IsRequested = d.IsRequested
            };
        }

        public static DocumentDetailDto ToDetailDto(this Document d)
        {
            return new DocumentDetailDto
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
                IsInClass = d.IsInClass,
                Description = d.Description,
                CreatedAt = d.CreatedAt,
                CreatedBy = d.CreatedBy,
                UpdatedAt = d.UpdatedAt,
                UpdatedBy = d.UpdatedBy,
                IsFeatured = d.IsFeatured,
                IsApproved = d.IsApproved,
                Status = d.Status ?? true,
                FileType = GetFileType(d.DocumentUrl),
                UploaderName = d.Username?.Fullname ?? d.Username?.Username,
                DocumentLengthType = d.DocumentLengthType,
                DocumentLevel = d.DocumentLevel,
                classes = d.Classes?.Select(c => new ClassListDto
                {
                    Id = c.Id,
                    Name = c.Name
                }).ToList() ?? new List<ClassListDto>(),
                IsRequested = d.IsRequested
            };
        }
        public static Document ToEntity(this CreateDocumentDto dto) => new Document
        {
            Name = dto.Name,
            SubjectId = dto.SubjectId,
            Grade = dto.Grade,
            DocumentCategoryId = dto.DocumentCategoryId,
            Description = dto.Description,
            SchoolId = dto.SchoolId,
            IsInClass = dto.IsInClass ?? false,
            IsFeatured = dto.IsFeatured,
            DocumentLengthType = dto.DocumentLengthType,
            DocumentLevel = dto.DocumentLevel
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
            IsInClass = dto.IsInClass ?? false,
            IsFeatured = dto.IsFeatured,
            DocumentLengthType = dto.DocumentLengthType,
            DocumentLevel = dto.DocumentLevel
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