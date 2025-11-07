namespace StudyHub.Backend.Domain.Entities
{
    public class ForumComment
    {
        public int CommentId { get; set; }
        public int PostId { get; set; }
        public int? ParentCommentId { get; set; }
        public string Content { get; set; } = string.Empty;
        public int TotalViolationScore { get; set; }
        public bool IsHidden { get; set; }
        public bool? Status { get; set; }

        public DateTime CreatedAt { get; set; }
        public Guid CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }
        public DateTime? DeletedAt { get; set; }

        public AppUser? Creator { get; set; }
        public int ReplyCount { get; set; }
        public List<ForumComment>? Replies { get; set; }
        public List<ForumAttachment>? Attachments { get; set; }
    }
}