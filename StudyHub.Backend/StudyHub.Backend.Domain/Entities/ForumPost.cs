namespace StudyHub.Backend.Domain.Entities
{
    public class ForumPost
    {
        public int Id { get; set; }
        public int SchoolId { get; set; }
        public short SubjectId { get; set; }
        public int? FlairId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public int TotalViolationScore { get; set; }
        public bool? Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }
        public DateTime? DeletedAt { get; set; }
        public bool IsHidden { get; set; }

        public Subject? Subject { get; set; }
        public School? School { get; set; }
        public ForumFlair? Flair { get; set; }
        public AppUser? Creator { get; set; }
        public int CommentCount { get; set; }
        public int AttachmentCount { get; set; }
        public List<ForumAttachment>? Attachments { get; set; }
        public List<ForumComment>? Comments { get; set; }
        public List<ViolationRecord>? ViolationRecords { get; set; }
    }
}