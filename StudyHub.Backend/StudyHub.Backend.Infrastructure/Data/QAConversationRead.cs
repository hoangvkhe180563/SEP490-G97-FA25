using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class QAConversationRead
{
    public Guid ConversationId { get; set; }

    public Guid UserId { get; set; }

    public DateTime LastReadAt { get; set; }

    public virtual QAConversation Conversation { get; set; } = null!;
}
