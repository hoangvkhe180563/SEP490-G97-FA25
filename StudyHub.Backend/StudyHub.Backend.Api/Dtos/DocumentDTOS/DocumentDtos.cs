using Microsoft.AspNetCore.Http;
using StudyHub.Backend.Api.Dtos.ClassDTOS;
using System.ComponentModel.DataAnnotations;


namespace StudyHub.Backend.Api.Dtos
{
    public class DocumentListDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? DocumentUrl { get; set; }
        public string? Thumbnail { get; set; }
        public string? Description { get; set; }
        public int SubjectId { get; set; }
        public string? SubjectName { get; set; }
        public sbyte Grade { get; set; }
        public byte DocumentCategoryId { get; set; }
        public string? CategoryName { get; set; }
        public int? SchoolId { get; set; }
        public string? SchoolName { get; set; }
        public bool? IsInClass { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsFeatured { get; set; }
        public bool? IsApproved { get; set; }
        public bool Status { get; set; }
        public string? FileType { get; set; }
        public string? UploaderName { get; set; }
        public string? UploaderUrl { get; set; }
            
        public List<ClassListDto> classes { get; set; } = new();
    }

    public class DocumentDetailDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? DocumentUrl { get; set; }
        public string? Thumbnail { get; set; }
        public int SubjectId { get; set; }
        public string? SubjectName { get; set; }
        public sbyte Grade { get; set; }
        public byte DocumentCategoryId { get; set; }
        public string? CategoryName { get; set; }
        public int? SchoolId { get; set; }
        public string? SchoolName { get; set; }
        public bool? IsInClass { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }
        public bool IsFeatured { get; set; }
        public bool? IsApproved { get; set; }
        public bool Status { get; set; }
        public string? FileType { get; set; }
        public List<ClassListDto> classes { get; set; } = new();

    }

    public class CreateDocumentDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public short SubjectId { get; set; }

        [Required]
        public sbyte Grade { get; set; }

        [Required]
        public sbyte DocumentCategoryId { get; set; }

        public string? Description { get; set; }

        public int? SchoolId { get; set; }

        public bool? IsInClass { get; set; }

        public bool IsFeatured { get; set; }

        [Required]
        public Guid CreatedBy { get; set; }

        [Required]
        public IFormFile DocumentFile { get; set; } = null!;

        public IFormFile? ThumbnailFile { get; set; }
        public List<ClassListDto> classes { get; set; } = new();

    }

    public class UpdateDocumentDto
    {
        [Required]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public short SubjectId { get; set; }

        [Required]
        public sbyte Grade { get; set; }

        [Required]
        public sbyte DocumentCategoryId { get; set; }

        public string? Description { get; set; }

        public int? SchoolId { get; set; }

        public bool? IsInClass { get; set; }

        public bool IsFeatured { get; set; }

        [Required]
        public Guid UpdatedBy { get; set; }

        public IFormFile? DocumentFile { get; set; }

        public IFormFile? ThumbnailFile { get; set; }
        public List<ClassListDto> classes { get; set; } = new();

    }

    public class DocumentFilterDto
    {
        public string? Query { get; set; }
        public int? CategoryId { get; set; }
        public int? Grade { get; set; }
        public int? SchoolId { get; set; }
        public bool? IsInClass { get; set; }
        public string? Subject { get; set; }
        public string? Description { get; set; }
        public string? UploaderId { get; set; }
        public bool? IsFeatured { get; set; }
        public bool? IsApproved { get; set; }
        public bool? Status { get; set; } = true;
        public bool? IsPendingApproval { get; set; }
        public bool IncludeUnapproved { get; set; }
        public List<ClassListDto> classes { get; set; } = new();

        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class ApprovalDto
    {
        [Required]
        public int DocumentId { get; set; }

        [Required]
        public Guid ApprovedBy { get; set; }
    }

    public class ToggleFeaturedDto
    {
        [Required]
        public int DocumentId { get; set; }

        [Required]
        public Guid UpdatedBy { get; set; }
    }
}