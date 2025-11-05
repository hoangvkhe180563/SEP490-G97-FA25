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
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }
        public string? FileType { get; set; }
        public string? UploaderName { get; set; }
        public string? UploaderUrl { get; set; }
        public string? UploaderFullname { get; set; }
        public List<ClassListDto> classes { get; set; } = new();
        public bool? IsRequested { get; set; }

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
        public string? UploaderName { get; set; }
        public string? UploaderUrl { get; set; }
        public string? UploaderFullname { get; set; }
        public List<ClassListDto> classes { get; set; } = new();
        public bool? IsRequested { get; set; }

    }

    public class CreateDocumentDto
    {
        [Required(ErrorMessage = "Tên tài liệu là bắt buộc")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Môn học là bắt buộc")]
        public short SubjectId { get; set; }

        [Required(ErrorMessage = "Khối là bắt buộc")]
        public sbyte Grade { get; set; }

        [Required(ErrorMessage = "Danh mục là bắt buộc")]
        public sbyte DocumentCategoryId { get; set; }

        public string? Description { get; set; }

        public int? SchoolId { get; set; }

        public bool? IsInClass { get; set; }

        public bool IsFeatured { get; set; }

        [Required(ErrorMessage = "File tài liệu là bắt buộc")]
        public IFormFile DocumentFile { get; set; } = null!;

        public IFormFile? ThumbnailFile { get; set; }
        public List<ClassListDto> classes { get; set; } = new();
    }

    public class UpdateDocumentDto
    {
        [Required]
        public int Id { get; set; }

        [Required(ErrorMessage = "Tên tài liệu là bắt buộc")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Môn học là bắt buộc")]
        public short SubjectId { get; set; }

        [Required(ErrorMessage = "Khối là bắt buộc")]
        public sbyte Grade { get; set; }

        [Required(ErrorMessage = "Danh mục là bắt buộc")]
        public sbyte DocumentCategoryId { get; set; }

        public string? Description { get; set; }

        public int? SchoolId { get; set; }

        public bool? IsInClass { get; set; }

        public bool IsFeatured { get; set; }

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
        public Guid? UploaderId { get; set; }
        public bool? IsFeatured { get; set; }
        public bool? IsApproved { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }
        public bool? Status { get; set; } = true;
        public bool? IsRequested { get; set; }
        //public bool? IsPendingApproval { get; set; }
        //public bool IncludeUnapproved { get; set; }
        //public DateTime? CreatedFrom { get; set; }
        //public DateTime? CreatedTo { get; set; }
        //public DateTime? UpdatedFrom { get; set; }
        //public DateTime? UpdatedTo { get; set; }
        public List<ClassListDto> classes { get; set; } = new();

        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class ApprovalDto
    {
        [Required(ErrorMessage = "DocumentId là bắt buộc")]
        public int DocumentId { get; set; }
    }

    public class ToggleFeaturedDto
    {
        [Required(ErrorMessage = "DocumentId là bắt buộc")]
        public int DocumentId { get; set; }
    }
}