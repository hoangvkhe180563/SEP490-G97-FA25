using System;
using System.Collections.Generic;

namespace StudyHub.Backend.Infrastructure.Data;

public partial class Transaction
{
    public int Id { get; set; }

    public Guid UserId { get; set; }

    public long Amount { get; set; }

    public string Type { get; set; } = null!;

    public int? CourseId { get; set; }

    public Guid? ConversationId { get; set; }

    public string? Description { get; set; }

    public string Status { get; set; } = null!;

    public string? TransactionCode { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? ProcessedAt { get; set; }

    public string? QrcodeUrl { get; set; }

    public string? AccountNumber { get; set; }

    public virtual QAConversation? Conversation { get; set; }

    public virtual Course? Course { get; set; }

    public virtual AppUser User { get; set; } = null!;
}
