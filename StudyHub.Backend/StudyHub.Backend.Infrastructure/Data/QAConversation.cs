using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class QAConversation
{
    public Guid Id { get; set; }

    public string Title { get; set; } = null!;

    public Guid StudentId { get; set; }

    public Guid? TeacherId { get; set; }

    public string Type { get; set; } = null!;

    public bool IsPaid { get; set; }

    public short TopicId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<QAMessage> QAMessages { get; set; } = new List<QAMessage>();

    public virtual AppUser Student { get; set; } = null!;

    public virtual AppUser? Teacher { get; set; }

    public virtual QATopic Topic { get; set; } = null!;

    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
