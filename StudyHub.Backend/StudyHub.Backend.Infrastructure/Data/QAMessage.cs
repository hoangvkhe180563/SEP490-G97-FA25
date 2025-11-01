using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class QAMessage
{
    public Guid Id { get; set; }

    public Guid ConversationId { get; set; }

    public Guid SenderId { get; set; }

    public string Content { get; set; } = null!;

    public bool IsFromAi { get; set; }

    public bool IsPaid { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual QAConversation Conversation { get; set; } = null!;

    public virtual AppUser Sender { get; set; } = null!;
}
