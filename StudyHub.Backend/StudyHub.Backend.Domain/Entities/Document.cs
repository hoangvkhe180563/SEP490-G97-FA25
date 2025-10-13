using System;

namespace StudyHub.Backend.Domain.Entities
{
    public class Document
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int DocumentCategoryId { get; set; }
        public string GradeName { get; set; } = string.Empty;
        public int? SchoolId { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string Accessibility { get; set; } = string.Empty;
        public string Thumbnail { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? DeletedAt { get; set; }
        public bool Status { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
