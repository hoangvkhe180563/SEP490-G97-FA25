using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class QATopic
{
    public short Id { get; set; }

    public short SubjectId { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public bool? IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<QAConversation> QAConversations { get; set; } = new List<QAConversation>();

    public virtual Subject Subject { get; set; } = null!;
}
