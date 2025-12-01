namespace StudyHub.Backend.Domain.Entities
{
    public class ForumAttachment
    {
        public int Id { get; set; }
        public int? PostId { get; set; }
        public int? CommentId { get; set; }
        public string FileUrl { get; set; } = string.Empty;
        public bool IsApproved { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid? CreatedBy { get; set; }
        public bool? IsModerationPending { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid? UpdatedBy { get; set; }
        public DateTime? DeletedAt { get; set; }
    }
}