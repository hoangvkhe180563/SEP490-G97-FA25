    namespace StudyHub.Backend.Domain.Entities
{
    public class Document : IAuditTrail
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public short SubjectId { get; set; }
        public sbyte Grade { get; set; }
        public sbyte DocumentCategoryId { get; set; }
        public string DocumentUrl { get; set; } = null!;
        public bool? IsApproved { get; set; }
        public bool? Status { get; set; }
        public string? Description { get; set; }
        public string? Thumbnail { get; set; }
        public int? SchoolId { get; set; }
        public bool IsInClass { get; set; }
        public bool IsFeatured { get; set; }
        public string DocumentLengthType { get; set; } = null!;
        public string DocumentLevel { get; set; } = null!;
        public List<Class> Classes { get; set; } = new List<Class>();
        public Subject? Subject { get; set; }
        public DocumentCategory? DocumentCategory { get; set; }
        public School? School { get; set; }
        public AppUser? Username { get; set; }
        public bool? IsRequested { get; set; }
    }
}