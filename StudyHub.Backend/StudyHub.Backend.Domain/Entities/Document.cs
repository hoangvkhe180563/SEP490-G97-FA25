using System;

namespace StudyHub.Backend.Domain.Entities
{
    public class Document
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int DocumentCategoryId { get; set; }
        public sbyte? GradeId { get; set; }
        public int? SchoolId { get; set; }
        public short? SubjectId { get; set; }
        public sbyte AccessibilityId { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? DeletedAt { get; set; }
        public bool Status { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public DocumentCategory? DocumentCategory { get; set; }
        public Accessibility? Accessibility { get; set; }
    }
}
