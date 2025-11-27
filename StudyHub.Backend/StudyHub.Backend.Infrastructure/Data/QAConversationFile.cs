using System;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class QAConversationFile
{
    public Guid Id { get; set; }

    public Guid ConversationId { get; set; }

    public Guid? CreatedBy { get; set; }

    public string FileUrl { get; set; } = null!;

    public string FileName { get; set; } = null!;

    public string? FileType { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual QAConversation Conversation { get; set; } = null!;

    public virtual AppUser? Creator { get; set; }
}
