namespace StudyHub.Backend.Api.Dtos.QADTOS
{
    public class QAConversationResponse
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = null!;
        public Guid StudentId { get; set; }
        public string StudentName { get; set; } = null!;
        public string StudentEmail { get; set; } = null!;
        public string StudentUsername { get; set; } = null!;
        public string StudentAvatar { get; set; } = null!;
        public Guid? TeacherId { get; set; }
        public string? TeacherName { get; set; }
        public string? TeacherEmail { get; set; }
        public string? TeacherUsername { get; set; }
        public string? TeacherAvatar { get; set; }
        public string Type { get; set; } = null!;
        public bool IsPaid { get; set; }
        public int TopicId { get; set; }
        public string TopicName { get; set; } = null!;
        public string SubjectName { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        // Number of unread messages for the requesting user
        public int UnreadCount { get; set; } = 0;
    }
}
