using System;

namespace StudyHub.Backend.Domain.Entities
{
    public class Document
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int SubjectId { get; set; }
        public int GradeId { get; set; }
        public int DocumentCategoryId { get; set; }
        public int AccessibilityId { get; set; }
        public string DocumentUrl { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public Guid CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }
        public DateTime? DeletedAt { get; set; }
        public bool? IsApproved { get; set; }
        public bool Status { get; set; }
        public string? Description { get; set; }
        public string? Thumbnail { get; set; }
        public int? SchoolId { get; set; }
        public bool IsFeatured { get; set; }
        public string GradeName { get; set; } = string.Empty;
        public string SubjectName { get; set; } = string.Empty;

        public Subject? Subject { get; set; }
        public Grade? Grade { get; set; }
        public DocumentCategory? DocumentCategory { get; set; }
        public Accessibility? Accessibility { get; set; }
        public School? School { get; set; }
        public AppUser? Username { get; set; }
    }
}