using StudyHub.Backend.Domain.Entities;

namespace StudyHub.Backend.UseCases.Dtos
{
    public class UpsertElasticDocumentRequest
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string DocumentUrl { get; set; } = null!;
        public string? Thumbnail { get; set; }
        public string DocumentLevel { get; set; } = null!;
        public string DocumentLengthType { get; set; } = null!;
        public int? SchoolId { get; set; }
        public Subject? Subject { get; set; }
        public DocumentCategory? DocumentCategory { get; set; }
        public int Grade { get; set; }
        public bool IsInClass { get; set; }
        public bool? Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
